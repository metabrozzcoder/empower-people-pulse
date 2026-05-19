import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Lock,
  Unlock,
  Clock,
  MapPin,
  Wifi,
  Smartphone
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface AccessRule {
  id: string
  name: string
  type: 'IP_RESTRICTION' | 'TIME_RESTRICTION' | 'LOCATION_RESTRICTION' | 'DEVICE_RESTRICTION'
  description: string
  isActive: boolean
  users: string[]
  rules: any
  createdDate: string
}

const mockAccessRules: AccessRule[] = []

export default function AccessControl() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [accessRules, setAccessRules] = useState<AccessRule[]>(mockAccessRules)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<AccessRule | null>(null)

  const filteredRules = accessRules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddRule = () => {
    setSelectedRule(null)
    setIsDialogOpen(true)
  }

  const handleEditRule = (rule: AccessRule) => {
    setSelectedRule(rule)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = (id: string) => {
    setAccessRules(accessRules.filter(rule => rule.id !== id))
    toast({
      title: t('pages.accessControl.deletedTitle'),
      description: t('pages.accessControl.deletedDesc'),
    })
  }

  const toggleRuleStatus = (id: string) => {
    setAccessRules(accessRules.map(rule =>
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ))
    toast({
      title: t('pages.accessControl.statusUpdatedTitle'),
      description: t('pages.accessControl.statusUpdatedDesc'),
    })
  }

  const getTypeIcon = (type: AccessRule['type']) => {
    switch (type) {
      case 'IP_RESTRICTION': return Wifi
      case 'TIME_RESTRICTION': return Clock
      case 'LOCATION_RESTRICTION': return MapPin
      case 'DEVICE_RESTRICTION': return Smartphone
      default: return Shield
    }
  }

  const getTypeColor = (type: AccessRule['type']) => {
    switch (type) {
      case 'IP_RESTRICTION': return 'bg-blue-100 text-blue-800'
      case 'TIME_RESTRICTION': return 'bg-green-100 text-green-800'
      case 'LOCATION_RESTRICTION': return 'bg-purple-100 text-purple-800'
      case 'DEVICE_RESTRICTION': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeRules = accessRules.filter(rule => rule.isActive).length
  const totalUsers = new Set(accessRules.flatMap(rule => rule.users)).size

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.accessControl.title')}</h1>
          <p className="text-muted-foreground">{t('pages.accessControl.subtitle')}</p>
        </div>
        <Button onClick={handleAddRule} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>{t('pages.accessControl.addRule')}</span>
        </Button>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">{t('pages.accessControl.noticeTitle')}</h4>
        <p className="text-sm text-blue-700">
          {t('pages.accessControl.noticeBody')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{accessRules.length}</p>
                <p className="text-sm text-muted-foreground">{t('pages.accessControl.totalRules')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Lock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeRules}</p>
                <p className="text-sm text-muted-foreground">{t('pages.accessControl.activeRules')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">{t('pages.accessControl.affectedUsers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Unlock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{accessRules.length - activeRules}</p>
                <p className="text-sm text-muted-foreground">{t('pages.accessControl.inactiveRules')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('pages.accessControl.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Access Rules */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.accessControl.rulesTitle')}</CardTitle>
          <CardDescription>{t('pages.accessControl.rulesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRules.map((rule) => {
              const TypeIcon = getTypeIcon(rule.type)
              const typeLabelKey =
                rule.type === 'IP_RESTRICTION' ? 'typeIp' :
                rule.type === 'TIME_RESTRICTION' ? 'typeTime' :
                rule.type === 'LOCATION_RESTRICTION' ? 'typeLocation' : 'typeDevice'
              return (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge className={getTypeColor(rule.type)}>
                          {t(`pages.accessControl.${typeLabelKey}`)}
                        </Badge>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? t('pages.accessControl.active') : t('pages.accessControl.inactive')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{t('pages.accessControl.users')}: {rule.users.length}</span>
                        <span>{t('pages.accessControl.created')}: {new Date(rule.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRuleStatus(rule.id)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? t('pages.accessControl.editRule') : t('pages.accessControl.createRule')}
            </DialogTitle>
            <DialogDescription>
              {selectedRule ? t('pages.accessControl.editDesc') : t('pages.accessControl.createDesc')}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t('pages.accessControl.tabGeneral')}</TabsTrigger>
              <TabsTrigger value="rules">{t('pages.accessControl.tabRules')}</TabsTrigger>
              <TabsTrigger value="users">{t('pages.accessControl.tabUsers')}</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('pages.accessControl.ruleName')}</Label>
                  <Input
                    id="name"
                    placeholder={t('pages.accessControl.ruleNamePlaceholder')}
                    defaultValue={selectedRule?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{t('pages.accessControl.ruleType')}</Label>
                  <Select defaultValue={selectedRule?.type}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('pages.accessControl.selectRuleType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IP_RESTRICTION">{t('pages.accessControl.typeIp')}</SelectItem>
                      <SelectItem value="TIME_RESTRICTION">{t('pages.accessControl.typeTime')}</SelectItem>
                      <SelectItem value="LOCATION_RESTRICTION">{t('pages.accessControl.typeLocation')}</SelectItem>
                      <SelectItem value="DEVICE_RESTRICTION">{t('pages.accessControl.typeDevice')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('pages.accessControl.description')}</Label>
                  <Input
                    id="description"
                    placeholder={t('pages.accessControl.descriptionPlaceholder')}
                    defaultValue={selectedRule?.description}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={selectedRule?.isActive ?? true} />
                  <Label>{t('pages.accessControl.enableRule')}</Label>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rules" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">{t('pages.accessControl.ruleConfig')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('pages.accessControl.ruleConfigDesc')}
                </p>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {t('pages.accessControl.ruleConfigPlaceholder')}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="users" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">{t('pages.accessControl.affectedUsersTitle')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('pages.accessControl.affectedUsersDesc')}
                </p>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {t('pages.accessControl.userSelectorPlaceholder')}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('pages.accessControl.cancel')}
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {selectedRule ? t('pages.accessControl.update') : t('pages.accessControl.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}