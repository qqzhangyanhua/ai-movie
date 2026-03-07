import type { LucideIcon } from 'lucide-react'

export interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

export interface Step {
  number: string
  title: string
  description: string
}

export interface ShowcaseVideo {
  id: string
  thumbnail: string
  title: string
  author: string
}
