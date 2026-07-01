import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  Building2,
  DollarSign,
  CalendarDays,
  UserCircle2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react"
import { formatDate } from '@/lib/date'

type ViewMode = "card" | "list"

type Order = {
  id: string
  title: string
  description: string | null
  department_id: string | null
  department_name: string | null
  budget: number
  currency: string
  due_date: string | null
  status: string
  created_by: string
  paid_at: string | null
  paid_by: string | null
  notes: string | null
  created_at: string
}

type Assignee = {
  id: string
  payment_order_id: string
  user_id: string
  status: string
  note: string | null
  decided_at: string | null
}

type ProfileLite = { id: string; name: string; email: string | null; department?: string | null }
type Dept = { id: string; name: string }

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/15 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-400",
  paid: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  cancelled: "bg-muted text-muted-foreground",
}

export default function PaymentCommission() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [departments, setDepartments] = useState<Dept[]>([])
  const [isAccountant, setIsAccountant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [open, setOpen] = useState(false)

  // Form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [departmentId, setDepartmentId] = useState<string>("")
  const [budget, setBudget] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [dueDate, setDueDate] = useState("")
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

  const profileById = useMemo(() => {
    const m: Record<string, ProfileLite> = {}
    profiles.forEach((p) => (m[p.id] = p))
    return m
  }, [profiles])

  async function loadAll() {
    setLoading(true)
    const [ordersRes, assigneesRes, profilesRes, deptsRes, rolesRes] = await Promise.all([
      supabase.from("payment_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("payment_order_assignees").select("*"),
      supabase.from("profiles").select("id, name, email, department"),
      supabase.from("departments").select("id, name").order("name"),
      currentUser
        ? supabase.from("user_roles").select("role").eq("user_id", currentUser.id)
        : Promise.resolve({ data: [] as { role: string }[] }),
    ])
    setOrders((ordersRes.data ?? []) as Order[])
    setAssignees((assigneesRes.data ?? []) as Assignee[])
    setProfiles((profilesRes.data ?? []) as ProfileLite[])
    setDepartments((deptsRes.data ?? []) as Dept[])
    setIsAccountant(
      (rolesRes.data ?? []).some(
        (r: { role: string }) => r.role === "accountant" || r.role === "admin"
      )
    )
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const ch = supabase
      .channel("payment_orders_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_orders" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_order_assignees" },
        () => loadAll()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  function resetForm() {
    setTitle("")
    setDescription("")
    setDepartmentId("")
    setBudget("")
    setCurrency("USD")
    setDueDate("")
    setSelectedAssignees([])
  }

  async function handleCreate() {
    if (!currentUser) return
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" })
      return
    }
    if (selectedAssignees.length === 0) {
      toast({
        title: "Assign at least one approver",
        description: "The order must be approved before the accountant can pay it.",
        variant: "destructive",
      })
      return
    }
    const dept = departments.find((d) => d.id === departmentId)
    const { data: created, error } = await supabase
      .from("payment_orders")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        department_id: departmentId || null,
        department_name: dept?.name ?? null,
        budget: Number(budget) || 0,
        currency,
        due_date: dueDate || null,
        created_by: currentUser.id,
      })
      .select()
      .single()
    if (error || !created) {
      toast({ title: "Could not create order", description: error?.message, variant: "destructive" })
      return
    }
    const rows = selectedAssignees.map((uid) => ({
      payment_order_id: created.id,
      user_id: uid,
    }))
    const { error: aErr } = await supabase.from("payment_order_assignees").insert(rows)
    if (aErr) {
      toast({ title: "Order created, but failed to assign", description: aErr.message, variant: "destructive" })
    } else {
      toast({ title: "Payment order created" })
    }
    resetForm()
    setOpen(false)
    loadAll()
  }

  async function decide(orderId: string, decision: "approved" | "rejected") {
    if (!currentUser) return
    const row = assignees.find(
      (a) => a.payment_order_id === orderId && a.user_id === currentUser.id
    )
    if (!row) return
    const { error } = await supabase
      .from("payment_order_assignees")
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq("id", row.id)
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" })
    } else {
      toast({ title: `Order ${decision}` })
      loadAll()
    }
  }

  async function markPaid(orderId: string) {
    if (!currentUser) return
    const { error } = await supabase
      .from("payment_orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: currentUser.id,
      })
      .eq("id", orderId)
    if (error) {
      toast({ title: "Could not mark as paid", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Order marked as paid" })
      loadAll()
    }
  }

  function assigneesFor(orderId: string) {
    return assignees.filter((a) => a.payment_order_id === orderId)
  }

  function userLabel(uid: string) {
    const p = profileById[uid]
    return p?.name || p?.email || uid.slice(0, 8)
  }

  const upcoming = orders.filter((o) => o.status === "pending" || o.status === "approved")
  const history = orders.filter((o) => o.status === "paid" || o.status === "rejected" || o.status === "cancelled")

  function renderOrder(o: Order) {
    const list = assigneesFor(o.id)
    const myRow = currentUser ? list.find((a) => a.user_id === currentUser.id) : undefined
    const fullyApproved = list.length > 0 && list.every((a) => a.status === "approved")

    return (
      <Card key={o.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{o.title}</CardTitle>
              {o.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{o.description}</p>
              )}
            </div>
            <Badge className={statusColor[o.status] ?? ""} variant="secondary">
              {o.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {o.budget.toLocaleString()} {o.currency}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{o.department_name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>By {userLabel(o.created_by)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{o.due_date ? formatDate(o.due_date) : "No due date"}</span>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Approvers
            </div>
            <div className="flex flex-wrap gap-2">
              {list.length === 0 && (
                <span className="text-sm text-muted-foreground">No approvers assigned</span>
              )}
              {list.map((a) => (
                <Badge
                  key={a.id}
                  variant="outline"
                  className="flex items-center gap-1.5"
                >
                  {a.status === "approved" && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                  {a.status === "rejected" && <XCircle className="h-3 w-3 text-red-600" />}
                  {a.status === "pending" && <Clock className="h-3 w-3 text-yellow-600" />}
                  {userLabel(a.user_id)}
                </Badge>
              ))}
            </div>
          </div>

          {o.status === "paid" && o.paid_by && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Paid by {userLabel(o.paid_by)}
              {o.paid_at && ` on ${formatDate(o.paid_at)}`}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {myRow && myRow.status === "pending" && o.status !== "paid" && (
              <>
                <Button size="sm" onClick={() => decide(o.id, "approved")}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide(o.id, "rejected")}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {isAccountant && fullyApproved && o.status !== "paid" && (
              <Button size="sm" variant="default" onClick={() => markPaid(o.id)}>
                <Wallet className="h-4 w-4 mr-1" />
                Mark as Paid
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderOrderRow(o: Order) {
    const list = assigneesFor(o.id)
    const myRow = currentUser ? list.find((a) => a.user_id === currentUser.id) : undefined
    const fullyApproved = list.length > 0 && list.every((a) => a.status === "approved")
    const approvedCount = list.filter((a) => a.status === "approved").length
    const rejectedCount = list.filter((a) => a.status === "rejected").length

    return (
      <div
        key={o.id}
        className="grid grid-cols-12 gap-4 items-center p-4 border-b last:border-b-0 hover:bg-muted/40 transition-colors text-sm"
      >
        {/* Order */}
        <div className="col-span-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{o.title}</span>
            <Badge className={statusColor[o.status] ?? ""} variant="secondary">
              {o.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {userLabel(o.created_by)}
          </p>
        </div>

        {/* Budget */}
        <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <span>
            {o.budget.toLocaleString()} {o.currency}
          </span>
        </div>

        {/* Department */}
        <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="truncate">{o.department_name ?? "—"}</span>
        </div>

        {/* Due Date */}
        <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{o.due_date ? formatDate(o.due_date) : "—"}</span>
        </div>

        {/* Assigners */}
        <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          <span>{approvedCount}</span>
          {rejectedCount > 0 && (
            <>
              <XCircle className="h-3.5 w-3.5 text-red-600 ml-1" />
              <span>{rejectedCount}</span>
            </>
          )}
          <span className="text-xs">/ {list.length}</span>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-2">
          {myRow && myRow.status === "pending" && o.status !== "paid" && (
            <>
              <Button size="sm" className="h-7 px-2" onClick={() => decide(o.id, "approved")}>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => decide(o.id, "rejected")}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {isAccountant && fullyApproved && o.status !== "paid" && (
            <Button size="sm" variant="default" className="h-7 px-2" onClick={() => markPaid(o.id)}>
              <Wallet className="h-3.5 w-3.5" />
            </Button>
          )}
          {o.status === "paid" && o.paid_by && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {userLabel(o.paid_by)}
            </span>
          )}
        </div>
      </div>
    )
  }

  function renderSection(title: string, items: Order[]) {
    if (loading) {
      return (
        <section>
          <h2 className="text-xl font-semibold mb-3">{title}</h2>
          <p className="text-muted-foreground">Loading…</p>
        </section>
      )
    }
    if (items.length === 0) {
      return (
        <section>
          <h2 className="text-xl font-semibold mb-3">{title}</h2>
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No {title.toLowerCase()} payment orders.
            </CardContent>
          </Card>
        </section>
      )
    }
    if (viewMode === "card") {
      return (
        <section>
          <h2 className="text-xl font-semibold mb-3">{title}</h2>
          <div className="grid gap-4 md:grid-cols-2">{items.map(renderOrder)}</div>
        </section>
      )
    }
    return (
      <section>
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <Card>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="col-span-3">Order</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Assigners</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y">{items.map(renderOrderRow)}</div>
        </Card>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Commission</h1>
          <p className="text-muted-foreground">
            Upcoming payment orders awaiting approval, then routed to the accountant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border bg-muted p-1">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 px-0"
              onClick={() => setViewMode("card")}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 px-0"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Payment Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create payment order</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Camera rental for shoot" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Reason / details"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Budget</Label>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["USD", "EUR", "UZS", "RUB", "GBP"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due date</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Approvers (must all approve)</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1.5 mt-1">
                    {profiles
                      .filter((p) => p.id !== currentUser?.id)
                      .map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                        >
                          <Checkbox
                            checked={selectedAssignees.includes(p.id)}
                            onCheckedChange={(c) => {
                              setSelectedAssignees((prev) =>
                                c ? [...prev, p.id] : prev.filter((x) => x !== p.id)
                              )
                            }}
                          />
                          <span>{p.name}</span>
                          {p.department && (
                            <span className="text-xs text-muted-foreground">· {p.department}</span>
                          )}
                        </label>
                      ))}
                    {profiles.length === 0 && (
                      <p className="text-xs text-muted-foreground">No users found.</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {renderSection("Upcoming", upcoming)}
      {history.length > 0 && renderSection("History", history)}
    </div>
  )
}
