export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  latest_video_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
  created_at: string
  updated_at: string
}


export interface Photo {
  id: string
  project_id: string
  file_path: string
  thumbnail_path: string | null
  file_size: number
  width: number
  height: number
  upload_at: string
  order_index: number
}

export interface Scene {
  id: string
  photo_id: string
  duration: number
  caption: string
  transition: string
  order: number
}

export interface ScriptContent {
  scenes: Scene[]
  metadata: {
    total_duration: number
    bgm: string | null
  }
}

export interface Script {
  id: string
  project_id: string | null
  user_id: string
  title: string
  content: ScriptContent
  description: string | null
  is_template: boolean
  is_public: boolean
  source_type: 'system' | 'user' | 'ai_generated'
  category: string | null
  tags: string[] | null
  clone_count: number
  created_at: string
}

export interface VideoTask {
  id: string
  project_id: string
  script_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_config: Record<string, unknown> | null
  result_video_path: string | null
  error_message: string | null
  progress: number
  created_at: string
  completed_at: string | null
}

export interface UserAiConfig {
  id: string
  user_id: string
  name: string
  provider: string
  base_url: string | null
  model: string | null
  is_default: boolean
  created_at: string
}

export interface BgmTrack {
  id: string
  name: string
  file_path: string
  duration: number
  category: string | null
  is_system: boolean
  user_id: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}
