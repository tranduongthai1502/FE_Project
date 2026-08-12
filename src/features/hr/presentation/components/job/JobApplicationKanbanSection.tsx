import { useMemo, useState } from 'react'
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  items: CandidateCard[]
}

const initialKanbanColumns: KanbanColumn[] = [
  {
    id: 'applied',
    label: 'Applied',
    items: [
      { id: 'alex-rivera', name: 'Alex Rivera', title: 'Senior Product Designer', time: '2h ago', score: '98% Match', checked: true },
      { id: 'elena-soroka', name: 'Elena Soroka', title: 'UX Architect', time: '5h ago', score: '84% Match', checked: true },
      { id: 'babie-teer', name: 'Babie Teer', title: 'UX Architect', time: '7h ago', score: '89% Match' },
    ],
  },
  {
    id: 'screening',
    label: 'Screening',
    items: [
      { id: 'marcus-chen', name: 'Marcus Chen', title: 'Lead Interaction Designer', time: '1d ago', score: '92% Match', checked: true },
      { id: 'laura-nhat', name: 'Laura Nhat', title: 'Lead Interaction Designer', time: '2d ago', score: '95% Match', checked: true },
    ],
  },
  {
    id: 'interview',
    label: 'Interview',
    items: [
      { id: 'suki-tanaka', name: 'Suki Tanaka', title: 'Visual Designer', score: '95% Match', checked: true, note: 'Tomorrow, 10:00 AM' },
      { id: 'amuro-tooru', name: 'Amuro Tooru', title: 'Visual Designer', score: '99% Match', checked: true, note: 'Tomorrow, 11:00 AM' },
    ],
  },
  {
    id: 'hired',
    label: 'Hired',
    items: [
      { id: 'james-wilson-1', name: 'James Wilson', title: 'Principle Designer', checked: true },
      { id: 'james-wilson-2', name: 'James Wilson', title: 'Principle Designer', checked: true },
    ],
  },
  {
    id: 'rejected',
    label: 'Rejected',
    items: [
      { id: 'candidate-029', name: 'Candidate #029', title: 'Skills Mismatch', muted: true },
      { id: 'candidate-030', name: 'Candidate #030', title: 'Skills Mismatch', muted: true },
    ],
  },
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
    opacity: isDragging ? 0.65 : 1,
    zIndex: isDragging ? 2 : undefined,
  }

  return (
    <section
      ref={setNodeRef}
      className={`${styles.kanbanCard} ${candidate.muted ? styles.kanbanCardMuted : ''}`}
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

export function JobApplicationKanbanSection() {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialKanbanColumns)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setColumns((currentColumns) => {
      const sourceColumn = findColumnByCardId(currentColumns, activeId)
      const targetColumn = findColumnByCardOrColumnId(currentColumns, overId)

      if (!sourceColumn || !targetColumn) return currentColumns

      const sourceIndex = sourceColumn.items.findIndex((item) => item.id === activeId)
      const activeCard = sourceColumn.items[sourceIndex]
      if (!activeCard) return currentColumns

      if (sourceColumn.id === targetColumn.id) {
        const targetIndex = targetColumn.items.findIndex((item) => item.id === overId)
        const nextIndex = targetIndex >= 0 ? targetIndex : targetColumn.items.length - 1

        return currentColumns.map((column) => (
          column.id === sourceColumn.id
            ? { ...column, items: arrayMove(column.items, sourceIndex, nextIndex) }
            : column
        ))
      }

      const targetIndex = targetColumn.items.findIndex((item) => item.id === overId)
      const insertIndex = targetIndex >= 0 ? targetIndex : targetColumn.items.length

      return currentColumns.map((column) => {
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
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <section className={styles.kanbanBoard}>
        {columns.map((column) => (
          <article className={styles.kanbanColumn} key={column.id}>
            <header>
              <span>{column.label}</span>
              <strong>{column.items.length}</strong>
            </header>
            <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy} id={column.id}>
              <div>
                {column.items.map((candidate) => (
                  <SortableCandidateCard candidate={candidate} stageLabel={column.label} key={candidate.id} />
                ))}
              </div>
            </SortableContext>
          </article>
        ))}
      </section>
    </DndContext>
  )
}
