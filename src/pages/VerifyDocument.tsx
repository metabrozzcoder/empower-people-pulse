import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ShieldCheck, ShieldAlert, Loader2, Download, ArrowLeft } from 'lucide-react'

interface PublicDoc {
  id: string
  title: string
  description: string | null
  body_html: string | null
  category: string | null
  status: string
  visibility: string
  owner_id: string
  approver_id: string | null
  receiver_name: string | null
  file_path: string | null
  file_type: string | null
  created_at: string
  reviewed_at: string | null
}

export default function VerifyDocument() {
  const { id } = useParams<{ id: string }>()
  const [doc, setDoc] = useState<PublicDoc | null>(null)
  const [ownerName, setOwnerName] = useState<string>('—')
  const [approverName, setApproverName] = useState<string>('—')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('documents')
        .select('id,title,description,body_html,category,status,visibility,owner_id,approver_id,receiver_name,file_path,file_type,created_at,reviewed_at')
        .eq('id', id)
        .maybeSingle()
      if (!data) { setNotFound(true); setLoading(false); return }
      const d = data as unknown as PublicDoc
      setDoc(d)

      const ids = [d.owner_id, d.approver_id].filter(Boolean) as string[]
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles_public' as never)
          .select('id, name')
          .in('id', ids)
        const byId = new Map<string, string>()
        ;(profs ?? []).forEach((p: { id: string; name: string }) => byId.set(p.id, p.name))
        setOwnerName(byId.get(d.owner_id) ?? '—')
        if (d.approver_id) setApproverName(byId.get(d.approver_id) ?? d.receiver_name ?? '—')
      }

      if (d.file_path) {
        const { data: signed } = await supabase.storage.from('documents').createSignedUrl(d.file_path, 300)
        if (signed?.signedUrl) setFileUrl(signed.signedUrl)
      }
      setLoading(false)
    })()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <ShieldAlert className="mb-3 h-10 w-10 text-destructive" />
        <h1 className="text-xl font-semibold">Document not found or not public</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only approved public documents can be verified through this link.
        </p>
        <RouterLink to="/" className="mt-4">
          <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </RouterLink>
      </div>
    )
  }

  const verified = doc.status === 'approved' && doc.visibility === 'public'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                <ShieldCheck className="h-9 w-9" />
              </div>
              <Badge className={verified
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-muted text-muted-foreground'}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {verified ? 'Verified · Public Document' : 'Not Verified'}
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{doc.title}</h1>
              {doc.category && <Badge variant="outline">{doc.category}</Badge>}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Owner / Submitter" value={ownerName} />
              <Field label="Approved by" value={approverName} />
              <Field label="Created" value={new Date(doc.created_at).toLocaleString()} />
              <Field label="Reviewed" value={doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleString() : '—'} />
            </div>

            {fileUrl && (
              <div className="mt-6 space-y-4">
                <DocumentPreview url={fileUrl} fileType={doc.file_type} title={doc.title} />
                <div className="flex justify-center">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Button><Download className="mr-2 h-4 w-4" /> Download attached file</Button>
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(doc.description || doc.body_html) && (
          <Card>
            <CardContent className="p-6">
              {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
              {doc.body_html && (
                <div
                  className="prose prose-sm dark:prose-invert mt-4 max-w-none"
                  dangerouslySetInnerHTML={{ __html: doc.body_html }}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function DocumentPreview({ url, fileType, title }: { url: string; fileType: string | null; title: string }) {
  const ft = (fileType || '').toLowerCase()
  const isImage = ft.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)
  const isPdf = ft === 'application/pdf' || /\.pdf(\?|$)/i.test(url)
  const isOffice = /(word|excel|powerpoint|officedocument|msword|ms-excel|ms-powerpoint)/.test(ft) || /\.(docx?|xlsx?|pptx?)(\?|$)/i.test(url)

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <img src={url} alt={title} className="mx-auto max-h-[600px] w-auto object-contain" />
      </div>
    )
  }
  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <iframe src={url} title={title} className="h-[600px] w-full" />
      </div>
    )
  }
  if (isOffice) {
    const viewer = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`
    return (
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <iframe src={viewer} title={title} className="h-[600px] w-full" />
      </div>
    )
  }
  return (
    <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      Preview not available for this file type. Use the download button below.
    </div>
  )
}
