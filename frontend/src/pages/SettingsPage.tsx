import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Star, Edit2, X, Check } from 'lucide-react'
import { getAiConfigs, createAiConfig, updateAiConfig, deleteAiConfig } from '@/api/ai-configs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toast'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import type { UserAiConfig } from '@/types'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude' },
  { value: 'runway', label: 'Runway' },
  { value: 'pika', label: 'Pika' },
  { value: 'kling', label: 'Kling' },
  { value: 'other', label: '其他' },
]

interface ConfigFormData {
  name: string
  provider: string
  base_url: string
  api_key: string
  model: string
  is_default: boolean
}

const emptyForm: ConfigFormData = {
  name: '',
  provider: 'openai',
  base_url: '',
  api_key: '',
  model: '',
  is_default: false,
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ConfigFormData>(emptyForm)

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: getAiConfigs,
  })

  const createMut = useMutation({
    mutationFn: createAiConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] })
      closeDialog()
      toast.success('AI 配置创建成功')
    },
    onError: () => toast.error('创建配置失败'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ConfigFormData>) =>
      updateAiConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] })
      closeDialog()
      toast.success('配置已更新')
    },
    onError: () => toast.error('更新配置失败'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAiConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] })
      toast.success('配置已删除')
    },
    onError: () => toast.error('删除配置失败'),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowDialog(true)
  }

  const openEdit = (config: UserAiConfig) => {
    setEditingId(config.id)
    setForm({
      name: config.name,
      provider: config.provider,
      base_url: config.base_url ?? '',
      api_key: '',
      model: config.model ?? '',
      is_default: config.is_default,
    })
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const payload: Record<string, unknown> = { id: editingId }
      if (form.name) payload.name = form.name
      if (form.provider) payload.provider = form.provider
      if (form.base_url) payload.base_url = form.base_url
      if (form.api_key) payload.api_key = form.api_key
      if (form.model) payload.model = form.model
      payload.is_default = form.is_default
      updateMut.mutate(payload as Parameters<typeof updateAiConfig>[1] & { id: string })
    } else {
      createMut.mutate(form)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理 AI 服务配置</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          添加配置
        </Button>
      </div>

      <div className="max-w-3xl">
        <h2 className="mb-4 text-lg font-semibold">AI 服务配置</h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        ) : configs.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              还没有 AI 配置，添加你的 API 密钥以开始使用
            </p>
            <Button className="mt-3" size="sm" onClick={openCreate}>
              添加第一个配置
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  {config.is_default && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.name}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {config.provider}
                      </span>
                    </div>
                    {config.model && (
                      <p className="text-xs text-muted-foreground">
                        模型: {config.model}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(config)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定删除此配置？'))
                        deleteMut.mutate(config.id)
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={showDialog}
        onClose={closeDialog}
        title={editingId ? '编辑 AI 配置' : '添加 AI 配置'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="config-name"
            label="配置名称"
            placeholder="例如：我的 GPT-4"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium">服务提供商</label>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="config-base-url"
            label="API Base URL（可选）"
            placeholder="https://api.openai.com/v1"
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
          />

          <Input
            id="config-api-key"
            label={editingId ? 'API Key（留空则不修改）' : 'API Key'}
            type="password"
            placeholder="sk-..."
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            required={!editingId}
          />

          <Input
            id="config-model"
            label="模型（可选）"
            placeholder="gpt-4o"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="rounded border-input"
            />
            设为默认配置
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              取消
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {editingId ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
