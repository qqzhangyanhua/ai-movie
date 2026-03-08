import { cn } from '@/lib/utils'

// ─── Base Skeleton ─────────────────────────────

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-white/5',
                className
            )}
        />
    )
}

// ─── Preset: Card Skeleton ─────────────────────

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-xl border border-white/5 bg-card/40 p-5 space-y-4', className)}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
            </div>
        </div>
    )
}

// ─── Preset: List Item Skeleton ────────────────

export function SkeletonListItem({ className }: SkeletonProps) {
    return (
        <div className={cn('flex items-center gap-4 rounded-lg border border-white/5 p-4', className)}>
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
        </div>
    )
}

// ─── Preset: Project Card Skeleton ─────────────

export function SkeletonProjectCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-2xl border border-white/5 bg-card/40 p-6 space-y-4', className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
        </div>
    )
}

// ─── Preset: Template Card Skeleton ────────────

export function SkeletonTemplateCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-xl border border-white/5 bg-card/40 p-5 space-y-3', className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-14 rounded-md" />
                <Skeleton className="h-6 w-14 rounded-md" />
                <Skeleton className="h-6 w-14 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-14 rounded-lg" />
            </div>
        </div>
    )
}
