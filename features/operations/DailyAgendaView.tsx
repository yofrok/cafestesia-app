import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KanbanTask, TaskStatus, User } from '../../types';
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR } from '../../constants';
import AgendaTaskCard from './AgendaTaskCard';
import SubTaskOverlay from './SubTaskOverlay';

interface DailyAgendaViewProps {
    tasks: KanbanTask[];
    onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
    onEditTask: (task: KanbanTask) => void;
    onUpdateTask: (updatedTask: KanbanTask) => void;
    onReorderTasks: (draggedTaskId: string, targetTaskId: string) => void;
    users: User[];
    highlightedTaskId: string | null;
    setHighlightedTaskId: (id: string | null) => void;
}

const PIXELS_PER_MINUTE = 2.5;
const GAP_THRESHOLD_MINUTES = 90; // Compress gaps larger than 1.5 hours
const MIN_BREAK_MINUTES = 15; // Show an indicator for breaks >= 15 minutes
const COMPRESSED_GAP_HEIGHT = 70; // The height of the "6h 0min..." block
const MIN_TASK_HEIGHT = 100; // Minimum height for a task card
const SHORT_BREAK_HEIGHT = 40; // Fixed height for short break indicators

interface TaskLayout {
    task: KanbanTask;
    top: number;
    height: number;
    left: number; // Final % left
    width: number; // Final % width
    zIndex: number;
}

// Define types for timeline items to resolve 'unknown' type errors.
interface BaseTimelineItem {
    startMinute: number;
    duration: number;
}
interface PositionedBaseTimelineItem extends BaseTimelineItem {
    top: number;
    height: number;
}
interface GapTimelineItem extends PositionedBaseTimelineItem {
    type: 'gap';
}
interface ShortBreakTimelineItem extends PositionedBaseTimelineItem {
    type: 'short_break';
}
interface EmptyTimelineItem extends PositionedBaseTimelineItem {
    type: 'empty';
}
interface TaskTimelineItem extends PositionedBaseTimelineItem {
    type: 'task';
    task: KanbanTask;
}
type PositionedTimelineItem = GapTimelineItem | ShortBreakTimelineItem | EmptyTimelineItem | TaskTimelineItem;

interface UnpositionedTaskTimelineItem extends BaseTimelineItem {
    type: 'task';
    task: KanbanTask;
}
interface UnpositionedGapTimelineItem extends BaseTimelineItem {
    type: 'gap';
}
interface UnpositionedShortBreakTimelineItem extends BaseTimelineItem {
    type: 'short_break';
}
interface UnpositionedEmptyTimelineItem extends BaseTimelineItem {
    type: 'empty';
}
type UnpositionedTimelineItem = UnpositionedGapTimelineItem | UnpositionedShortBreakTimelineItem | UnpositionedEmptyTimelineItem | UnpositionedTaskTimelineItem;


const formatGapDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}min entre tareas`;
};

const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};


const DailyAgendaView: React.FC<DailyAgendaViewProps> = ({ tasks, onUpdateStatus, onEditTask, onUpdateTask, onReorderTasks, users, highlightedTaskId, setHighlightedTaskId }) => {
    const [now, setNow] = useState(new Date());
    const [taskForSubtasks, setTaskForSubtasks] = useState<KanbanTask | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const taskCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const userColorMap = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.name] = user.color;
            return acc;
        }, {} as Record<string, string>);
    }, [users]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (taskForSubtasks) {
            const updatedTask = tasks.find(t => t.id === taskForSubtasks.id);
            if (updatedTask) {
                setTaskForSubtasks(updatedTask);
            } else {
                setTaskForSubtasks(null);
            }
        }
    }, [tasks, taskForSubtasks]);

     useEffect(() => {
        if (highlightedTaskId && taskCardRefs.current[highlightedTaskId]) {
            const element = taskCardRefs.current[highlightedTaskId];
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Set a timeout to remove the highlight after the animation
            const timer = setTimeout(() => {
                setHighlightedTaskId(null);
            }, 2500); // Animation is 2s, so 2.5s is safe

            return () => clearTimeout(timer);
        }
    }, [highlightedTaskId, setHighlightedTaskId]);

    const { timelineItems, totalHeight, getPositionForMinute } = useMemo(() => {
        const items: UnpositionedTimelineItem[] = [];
        const sortedTasks = tasks
            .filter(t => t.time)
            .sort((a, b) => a.time!.localeCompare(b.time!));

        let lastEndMinute = TIMELINE_START_HOUR * 60;

        sortedTasks.forEach(task => {
            const startMinute = timeToMinutes(task.time!);
            const endMinute = startMinute + task.duration;

            const gap = startMinute - lastEndMinute;
            if (gap > GAP_THRESHOLD_MINUTES) {
                items.push({ type: 'gap', startMinute: lastEndMinute, duration: gap });
            } else if (gap >= MIN_BREAK_MINUTES) {
                items.push({ type: 'short_break', startMinute: lastEndMinute, duration: gap });
            } else if (gap > 0) {
                items.push({ type: 'empty', startMinute: lastEndMinute, duration: gap });
            }
            
            items.push({ type: 'task', task, startMinute, duration: task.duration });
            
            lastEndMinute = Math.max(lastEndMinute, endMinute);
        });
        
        const finalGap = (TIMELINE_END_HOUR * 60) - lastEndMinute;
        if (finalGap > GAP_THRESHOLD_MINUTES) {
            items.push({ type: 'gap', startMinute: lastEndMinute, duration: finalGap });
        } else if (finalGap >= MIN_BREAK_MINUTES) {
            items.push({ type: 'short_break', startMinute: lastEndMinute, duration: finalGap });
        } else if (finalGap > 0) {
            items.push({ type: 'empty', startMinute: lastEndMinute, duration: finalGap });
        }

        let currentY = 0;
        const positionedItems: PositionedTimelineItem[] = items.map(item => {
            const top = currentY;
            let height = 0;
            if (item.type === 'task') {
                height = Math.max(item.duration * PIXELS_PER_MINUTE, MIN_TASK_HEIGHT);
            } else if (item.type === 'gap') {
                height = COMPRESSED_GAP_HEIGHT;
            } else if (item.type === 'short_break') {
                height = SHORT_BREAK_HEIGHT;
            } else if (item.type === 'empty') {
                height = item.duration * PIXELS_PER_MINUTE;
            }
            currentY += height;
            return { ...item, top, height } as PositionedTimelineItem;
        });

        const getPosition = (minute: number) => {
            for (const item of positionedItems) {
                if (minute >= item.startMinute && minute < item.startMinute + item.duration) {
                    const minuteIntoItem = minute - item.startMinute;
                    if (item.type === 'task' || item.type === 'empty') {
                        return item.top + minuteIntoItem * PIXELS_PER_MINUTE;
                    } else if (item.type === 'gap' || item.type === 'short_break') {
                        return item.top + (minuteIntoItem / item.duration) * item.height;
                    }
                }
            }
            // Default for times outside any specific item
            const lastItem = positionedItems[positionedItems.length - 1];
            if (lastItem) {
                 return lastItem.top + lastItem.height;
            }
            return (minute - TIMELINE_START_HOUR * 60) * PIXELS_PER_MINUTE;
        };
        
        return { timelineItems: positionedItems, totalHeight: currentY, getPositionForMinute: getPosition };
    }, [tasks]);
    
    const taskLayouts = useMemo((): TaskLayout[] => {
        const positionedTasks = timelineItems.filter((item): item is TaskTimelineItem => item.type === 'task');
        if (positionedTasks.length === 0) return [];
    
        const layouts: TaskLayout[] = [];
        const processedTaskIds = new Set<string>();
    
        // Sort all tasks by start time initially
        const sortedByTime = [...positionedTasks].sort((a, b) => a.startMinute - b.startMinute);
    
        for (const taskItem of sortedByTime) {
            if (processedTaskIds.has(taskItem.task.id)) {
                continue;
            }
    
            // 1. Build the full, transitive collision group based on ACTUAL TIME overlap
            const collisionGroup: TaskTimelineItem[] = [];
            const queue = [taskItem];
            const visitedInGroup = new Set<string>([taskItem.task.id]);
    
            while (queue.length > 0) {
                const current = queue.shift()!;
                collisionGroup.push(current);
    
                const currentStart = current.startMinute;
                const currentEnd = currentStart + current.task.duration;
    
                for (const other of sortedByTime) {
                    if (!visitedInGroup.has(other.task.id)) {
                        const otherStart = other.startMinute;
                        const otherEnd = otherStart + other.task.duration;
    
                        // Correct time-based collision detection
                        const collides = (currentStart < otherEnd) && (currentEnd > otherStart);
                        
                        if (collides) {
                            visitedInGroup.add(other.task.id);
                            queue.push(other);
                        }
                    }
                }
            }
            
            collisionGroup.forEach(item => processedTaskIds.add(item.task.id));
            
            // 2. Assign columns based on ACTUAL time overlap within the group
            collisionGroup.sort((a, b) => a.startMinute - b.startMinute);
            
            const columns: TaskTimelineItem[][] = [];
            for (const event of collisionGroup) {
                let placed = false;
                for (const col of columns) {
                    const lastInCol = col[col.length - 1];
                    const lastEventEndTime = lastInCol.startMinute + lastInCol.task.duration;
                    
                    if (event.startMinute >= lastEventEndTime) {
                        col.push(event);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    columns.push([event]);
                }
            }
    
            // 3. Calculate final layout properties for this group
            const numColumns = columns.length;
            columns.forEach((col, colIndex) => {
                col.forEach(item => {
                    layouts.push({
                        task: item.task,
                        top: item.top,
                        height: item.height,
                        width: 100 / numColumns,
                        left: (colIndex / numColumns) * 100,
                        zIndex: colIndex + 1,
                    });
                });
            });
        }
        return layouts;
    }, [timelineItems]);


    const timelineMarkers = useMemo(() => {
        const markers = new Map<number, string>();
        // FIX: Explicitly type the Map to prevent TypeScript from inferring 'unknown' for its values.
        // This resolves the error "Property 'left' does not exist on type 'unknown'".
        const taskLayoutMap = new Map<string, TaskLayout>(taskLayouts.map(l => [l.task.id, l]));
    
        const hoursToShow = new Set<number>();
        if (timelineItems.length === 0) {
            for(let i = TIMELINE_START_HOUR; i <= TIMELINE_END_HOUR; i++) hoursToShow.add(i);
        } else {
            timelineItems.forEach(item => {
                const startHour = Math.floor(item.startMinute / 60);
                const endMinute = item.startMinute + item.duration;
                const endHour = Math.ceil(endMinute / 60);
    
                if (item.type === 'gap') {
                    hoursToShow.add(startHour);
                    hoursToShow.add(endHour);
                } else if (item.type === 'task') {
                    hoursToShow.add(startHour);
                } else if ( (item.type === 'empty' || item.type === 'short_break') && item.startMinute % 60 === 0) {
                     hoursToShow.add(startHour);
                }
            });
            hoursToShow.add(TIMELINE_START_HOUR);
            hoursToShow.add(TIMELINE_END_HOUR);
        }
    
        hoursToShow.forEach(hour => {
            if (hour > TIMELINE_END_HOUR) return;
            markers.set(hour * 60, `${String(hour).padStart(2, '0')}:00`);
        });
    
        timelineItems.forEach(item => {
            if (item.type === 'task') {
                const { startMinute, task } = item;
                
                const layout = taskLayoutMap.get(task.id);
                if (layout && layout.left > 0) {
                    return;
                }

                const hour = Math.floor(startMinute / 60);
                const minute = startMinute % 60;
                if (minute !== 0) {
                    markers.set(startMinute, `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
                }
            }
        });
    
        const sortedMarkers = Array.from(markers.entries())
            .map(([minute, label]) => ({ minute, label }))
            .sort((a, b) => a.minute - b.minute);
    
        if (sortedMarkers.length < 2) return sortedMarkers;
    
        const finalMarkers = [sortedMarkers[0]];
    
        for (let i = 1; i < sortedMarkers.length; i++) {
            const lastMarker = finalMarkers[finalMarkers.length - 1];
            const currentMarker = sortedMarkers[i];
            
            const lastPos = getPositionForMinute(lastMarker.minute);
            const currentPos = getPositionForMinute(currentMarker.minute);

            if (currentPos - lastPos > 20) { // Min 20px distance
                finalMarkers.push(currentMarker);
            }
        }
    
        return finalMarkers;
    }, [timelineItems, getPositionForMinute, taskLayouts]);


    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const currentTimePosition = getPositionForMinute(nowMinutes);
    
    // --- Drag and Drop Handlers for Mouse ---
    const handleDragStart = (taskId: string) => {
        setDraggedTaskId(taskId);
    };

    const handleDragOver = (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        if (taskId !== draggedTaskId) {
            setDropTargetId(taskId);
        }
    };

    const handleDrop = (targetTaskId: string) => {
        if (draggedTaskId && targetTaskId !== draggedTaskId) {
            onReorderTasks(draggedTaskId, targetTaskId);
        }
        setDraggedTaskId(null);
        setDropTargetId(null);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDropTargetId(null);
    };

    const handleDragLeave = () => {
        setDropTargetId(null);
    };

    // --- Drag and Drop Handlers for Touch ---
    const handleTouchStart = (_e: React.TouchEvent, taskId: string) => {
        setDraggedTaskId(taskId);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggedTaskId) return;
        
        // Prevent scrolling page while dragging a task
        e.preventDefault();

        const touch = e.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (targetElement) {
            const cardElement = targetElement.closest('[data-task-id]');
            if (cardElement) {
                const targetId = cardElement.getAttribute('data-task-id');
                if (targetId && targetId !== draggedTaskId && targetId !== dropTargetId) {
                    setDropTargetId(targetId);
                }
            } else {
                 if (dropTargetId) {
                     setDropTargetId(null);
                 }
            }
        }
    };

    const handleTouchEnd = () => {
        if (draggedTaskId && dropTargetId) {
            onReorderTasks(draggedTaskId, dropTargetId);
        }
        setDraggedTaskId(null);
        setDropTargetId(null);
    };


    return (
        <div className="p-4 md:p-6 h-full relative">
            <div className="relative z-10" style={{ height: `${totalHeight}px` }}>
                {/* Time markers */}
                {timelineMarkers.map(({ minute, label }) => {
                    const top = getPositionForMinute(minute);
                    if (top > totalHeight + 1 || minute > TIMELINE_END_HOUR * 60) return null;
                    const isHour = minute % 60 === 0;
                    return (
                        <div key={minute} className="absolute w-full" style={{ top: `${top}px` }}>
                            <span className={`absolute -top-2.5 left-0 text-xs w-16 text-right pr-4 ${isHour ? 'font-semibold text-gray-500' : 'font-normal text-gray-400'}`}>
                                {label}
                            </span>
                            <div className={`h-px ml-16 ${isHour ? 'bg-gray-200' : 'bg-gray-200/60'}`}></div>
                        </div>
                    );
                })}
                
                {/* Current time indicator */}
                {currentTimePosition >= 0 && currentTimePosition <= totalHeight && (
                     <div className="absolute left-16 right-0 h-0.5 bg-red-500 z-20" style={{ top: `${currentTimePosition}px` }}>
                        <div className="absolute -left-1.5 -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    </div>
                )}
               
                <div className="absolute top-0 bottom-0 left-16 right-0">
                    {/* Compressed Gap markers */}
                    {timelineItems.filter((item): item is GapTimelineItem => item.type === 'gap').map(item => (
                         <div key={`gap-${item.startMinute}`} className="absolute w-full flex items-center" style={{ top: `${item.top}px`, height: `${item.height}px` }}>
                            <div className="w-full border-t-2 border-dashed border-gray-300 relative">
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-xs font-semibold text-gray-500">
                                    {formatGapDuration(item.duration)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {/* Short Break Indicators */}
                    {timelineItems.filter((item): item is ShortBreakTimelineItem => item.type === 'short_break').map(item => (
                        <div key={`break-${item.startMinute}`} className="absolute w-full flex items-center" style={{ top: `${item.top}px`, height: `${item.height}px` }}>
                            <div className="w-full flex items-center justify-center gap-2 text-gray-400">
                                <div className="flex-grow border-t border-dashed border-gray-300"></div>
                                <span className="text-xs font-semibold whitespace-nowrap">{Math.round(item.duration)} min libres</span>
                                <div className="flex-grow border-t border-dashed border-gray-300"></div>
                            </div>
                        </div>
                    ))}
                    {/* Task Cards */}
                   {taskLayouts.map(({ task, top, height, left, width, zIndex }) => (
                       <AgendaTaskCard 
                            // FIX: The ref callback for a forwardRef component should not return a value.
                            // The assignment expression `(a = b)` returns `b`, which violates the `(instance) => void` type.
                            // Wrapping the assignment in curly braces `{}` makes the function implicitly return `undefined`.
                           ref={el => { taskCardRefs.current[task.id] = el; }}
                           key={task.id}
                           task={task}
                           onUpdateStatus={onUpdateStatus}
                           onEdit={onEditTask}
                           onViewSubtasks={() => setTaskForSubtasks(task)}
                           userColor={userColorMap[task.employee] || '#9ca3af'}
                           style={{
                               top: `${top}px`,
                               height: `${height - 4}px`, // 4px margin
                               left: `${left}%`,
                               width: `calc(${width}% - 4px)`,
                               zIndex: zIndex,
                           }}
                           onDragStart={handleDragStart}
                           onDragOver={handleDragOver}
                           onDrop={handleDrop}
                           onDragEnd={handleDragEnd}
                           onDragLeave={handleDragLeave}
                           onTouchStart={handleTouchStart}
                           onTouchMove={handleTouchMove}
                           onTouchEnd={handleTouchEnd}
                           isBeingDragged={task.id === draggedTaskId}
                           isDropTarget={task.id === dropTargetId}
                           isHighlighted={task.id === highlightedTaskId}
                       />
                   ))}
                </div>
            </div>
            {taskForSubtasks && (
                <SubTaskOverlay
                    task={taskForSubtasks}
                    onClose={() => setTaskForSubtasks(null)}
                    onUpdateTask={onUpdateTask}
                />
            )}
        </div>
    );
};

export default DailyAgendaView;