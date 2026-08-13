import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Candidate } from '@/features/hr/domain/candidate.types'
import { hrCandidateApplicationApi } from '@/features/hr/infrastructure/hrCandidateApplicationApi'
import styles from '@/features/hr/presentation/pages/HrDashboard.module.css'

type CandidateCard = {
  id: string
  name: string
  title: string
  time?: string
  score?: string
  checked?: boolean
  muted?: boolean
  note?: string
}

type KanbanColumn = {
  id: string
  label: string
  status: string
  items: CandidateCard[]
}

type DragPreviewPosition = {
  columnId: string
  index: number
}

const kanbanColumnMeta = [
  { id: 'applied', label: 'Applied', status: 'APPLIED' },
  { id: 'screening', label: 'Screening', status: 'SCREENING' },
  { id: 'interview', label: 'Interview', status: 'INTERVIEW' },
  { id: 'hired', label: 'Hired', status: 'HIRED' },
  { id: 'rejected', label: 'Rejected', status: 'REJECTED' },
]

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function findColumnByCardId(columns: KanbanColumn[], cardId: string) {
  return columns.find((column) => column.items.some((item) => item.id === cardId))
}

function findColumnByCardOrColumnId(columns: KanbanColumn[], id: string) {
  return columns.find((column) => column.id === id || column.items.some((item) => item.id === id))
}

function toCandidateCard(candidate: Candidate): CandidateCard {
  return {
    id: candidate.id,
    name: candidate.name,
    title: candidate.targetJob,
    time: candidate.dateApplied !== '-' ? candidate.dateApplied : undefined,
    score: `${candidate.matchScore}% Match`,
    checked: candidate.reviewed,
  }
}

function buildEmptyColumns(): KanbanColumn[] {
  return kanbanColumnMeta.map((column) => ({ ...column, items: [] }))
}

function moveCandidateCard(columns: KanbanColumn[], activeId: string, overId: string) {
  const sourceColumn = findColumnByCardId(columns, activeId)
  const targetColumn = findColumnByCardOrColumnId(columns, overId)

  if (!sourceColumn || !targetColumn) return columns

  const sourceIndex = sourceColumn.items.findIndex((item) => item.id === activeId)
  const activeCard = sourceColumn.items[sourceIndex]
  if (!activeCard) return columns

  if (sourceColumn.id === targetColumn.id) {
    const targetIndex = targetColumn.items.findIndex((item) => item.id === overId)
    const nextIndex = targetIndex >= 0 ? targetIndex : targetColumn.items.length - 1

    return columns.map((column) => (
      column.id === sourceColumn.id
        ? { ...column, items: arrayMove(column.items, sourceIndex, nextIndex) }
        : column
    ))
  }

  const targetIndex = targetColumn.items.findIndex((item) => item.id === overId)
  const insertIndex = targetIndex >= 0 ? targetIndex : targetColumn.items.length

  return columns.map((column) => {
    if (column.id === sourceColumn.id) {
      return { ...column, items: column.items.filter((item) => item.id !== activeId) }
    }

    if (column.id === targetColumn.id) {
      const nextItems = [...column.items]
      nextItems.splice(insertIndex, 0, activeCard)
      return { ...column, items: nextItems }
    }

    return column
  })
}

function getDragPreviewPosition(columns: KanbanColumn[], activeId: string, overId: string): DragPreviewPosition | null {
  const targetColumn = findColumnByCardOrColumnId(columns, overId)
  if (!targetColumn) return null

  const targetIndex = targetColumn.items.findIndex((item) => item.id === overId)
  const rawIndex = targetIndex >= 0 ? targetIndex : targetColumn.items.length
  const sourceColumn = findColumnByCardId(columns, activeId)

  if (sourceColumn?.id !== targetColumn.id) {
    return { columnId: targetColumn.id, index: rawIndex }
  }

  const sourceIndex = sourceColumn.items.findIndex((item) => item.id === activeId)
  if (sourceIndex === -1 || sourceIndex === rawIndex) return null

  return {
    columnId: targetColumn.id,
    index: sourceIndex < rawIndex ? rawIndex + 1 : rawIndex,
  }
}

function KanbanDropArea({
  column,
  activeId,
  preview,
}: {
  column: KanbanColumn
  activeId: string | null
  preview: DragPreviewPosition | null
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id })
  const showSkeletonAtEnd = preview?.columnId === column.id && preview.index >= column.items.length

  return (
    <div ref={setNodeRef} className={`${styles.kanbanDropArea} ${isOver ? styles.kanbanDropAreaOver : ''}`}>
      {column.items.map((candidate, index) => (
        <div className={styles.kanbanItemSlot} key={candidate.id}>
          {preview?.columnId === column.id && preview.index === index && candidate.id !== activeId && <KanbanCardSkeleton />}
          <SortableCandidateCard candidate={candidate} stageLabel={column.label} />
        </div>
      ))}
      {showSkeletonAtEnd && <KanbanCardSkeleton />}
    </div>
  )
}

function KanbanCardSkeleton() {
  return (
    <div className={styles.kanbanCardSkeleton} aria-hidden="true">
      <span></span>
      <div>
        <b></b>
        <small></small>
        <em></em>
      </div>
    </div>
  )
}

function SortableCandidateCard({ candidate, stageLabel }: { candidate: CandidateCard; stageLabel: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id })

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 2 : undefined,
  }

  return (
    <section
      ref={setNodeRef}
      className={`${styles.kanbanCard} ${candidate.muted ? styles.kanbanCardMuted : ''} ${isDragging ? styles.kanbanCardDragging : ''}`}
      style={cardStyle}
      {...attributes}
      {...listeners}
    >
      <div className={styles.kanbanAvatar}>{candidate.muted ? <i className="fa-regular fa-user"></i> : getInitials(candidate.name)}</div>
      <div>
        <h2>{candidate.name}</h2>
        <p>{candidate.title}</p>
        {candidate.note && (
          <aside>
            <i className="fa-regular fa-calendar"></i>
            <span>{candidate.note}</span>
            <small>Panel Interview with Tech Team</small>
          </aside>
        )}
        <footer>
          {candidate.time && <small>{candidate.time}</small>}
          <span>Stage: {stageLabel}</span>
        </footer>
      </div>
      {candidate.score && <em>{candidate.score}</em>}
      <b className={candidate.checked ? styles.kanbanChecked : undefined}></b>
    </section>
  )
}

export function JobApplicationKanbanSection({ jobId }: { jobId: string }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [preview, setPreview] = useState<DragPreviewPosition | null>(null)
  const [optimisticColumns, setOptimisticColumns] = useState<KanbanColumn[] | null>(null)
  const kanbanQuery = useQuery({
    queryKey: ['hr', 'candidate-applications', 'kanban', jobId],
    queryFn: async () => {
      const entries = await Promise.all(kanbanColumnMeta.map(async (column) => {
        const candidates = await hrCandidateApplicationApi.getCandidateApplications({
          page: 1,
          size: 100,
          sortField: 'createdAt',
          sortBy: 'DESC',
          filters: {
            jobId,
            status: column.status,
          },
        })

        return { ...column, items: candidates.map(toCandidateCard) }
      }))

      return entries
    },
    enabled: Boolean(jobId),
  })
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      hrCandidateApplicationApi.updateCandidateApplicationStatus(id, status),
  })
  const columns = optimisticColumns ?? kanbanQuery.data ?? buildEmptyColumns()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      setPreview(null)
      return
    }

    setPreview(getDragPreviewPosition(columns, String(active.id), String(over.id)))
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setPreview(null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    setPreview(null)

    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const sourceColumn = findColumnByCardId(columns, activeId)
    const targetColumn = findColumnByCardOrColumnId(columns, overId)
    if (!sourceColumn || !targetColumn) return

    const previousColumns = columns
    const nextColumns = moveCandidateCard(columns, activeId, overId)
    setOptimisticColumns(nextColumns)

    if (sourceColumn.status === targetColumn.status) return

    updateStatusMutation.mutate({ id: activeId, status: targetColumn.status }, {
      onError: () => {
        setOptimisticColumns(previousColumns)
      },
      onSuccess: async () => {
        await kanbanQuery.refetch()
        setOptimisticColumns(null)
      },
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <section className={styles.kanbanBoard}>
        {columns.map((column) => (
          <article className={styles.kanbanColumn} key={column.id}>
            <header>
              <span>{column.label}</span>
              <strong>{column.items.length}</strong>
            </header>
            <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy} id={column.id}>
              <KanbanDropArea column={column} activeId={activeId} preview={preview} />
            </SortableContext>
          </article>
        ))}
      </section>
      {kanbanQuery.isLoading && <div className={styles.kanbanBoardState}>Loading applications...</div>}
      {kanbanQuery.isError && <div className={`${styles.kanbanBoardState} ${styles.kanbanBoardStateError}`}>Unable to load applications.</div>}
    </DndContext>
  )
}
