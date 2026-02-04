'use client';

import React from 'react';
import { VACoreTask, TaskStatus } from '@/types/admin.types';
import { Ban, FileText, ExternalLink, Clock } from 'lucide-react';
import { getLabelClasses } from '@/lib/constants/labels';

interface TasksDataTableProps {
  tasks: VACoreTask[];
  loading: boolean;
  onSelectTask: (task: VACoreTask) => void;
  selectedTaskId?: string;
  onCannotApply?: (task: VACoreTask) => void;
  showCannotApplyReason?: boolean;
  showProofColumn?: boolean;
  onClaimTask?: (task: VACoreTask) => void;
  currentUserId?: string;
  claimDisabled?: boolean;
  activeClaimCount?: number;
  maxClaims?: number;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Applying':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Applied':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Trashed':
      return 'bg-red-50 text-red-700 border-red-100';
    case 'Overdue':
      return 'bg-orange-50 text-orange-700 border-orange-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const getAIStatusBadge = (status: string) => {
  switch (status) {
    case 'Pending':
      return <span className="flex items-center gap-1 text-slate-400 font-bold uppercase text-[9px]"><span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>Pending</span>;
    case 'In Progress':
      return <span className="flex items-center gap-1 text-blue-600 font-bold uppercase text-[9px]"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>In Ops</span>;
    case 'Completed':
      return <span className="flex items-center gap-1 text-emerald-600 font-bold uppercase text-[9px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>Ready</span>;
    case 'Error':
      return <span className="flex items-center gap-1 text-rose-600 font-bold uppercase text-[9px]"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>Failed</span>;
    default:
      return status;
  }
};

export function TasksDataTable({
  tasks,
  loading,
  onSelectTask,
  selectedTaskId,
  onCannotApply,
  showCannotApplyReason,
  showProofColumn,
  onClaimTask,
  currentUserId,
  claimDisabled,
  activeClaimCount,
  maxClaims,
}: TasksDataTableProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-white/50 rounded-2xl border border-dashed border-slate-200" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" suppressHydrationWarning></div>
          <p className="mt-3 text-xs font-bold text-slate-900 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-white/50 rounded-2xl border border-dashed border-slate-200" suppressHydrationWarning>
        <div className="text-center max-w-sm" suppressHydrationWarning>
          <div className="bg-slate-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3" suppressHydrationWarning>
            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <p className="text-base font-black text-slate-900">No Missions Found</p>
          <p className="text-xs text-slate-500 mt-1">No tasks match the current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                ID
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Job
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Labels
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Client
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                AI
              </th>
              <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Assigned
              </th>
              {showProofColumn && (
                <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Proof
                </th>
              )}
              {showCannotApplyReason && (
                <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Reason
                </th>
              )}
              {onCannotApply && (
                <th className="px-3 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map(task => {
              const isSelected = selectedTaskId === task.id;
              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`group cursor-pointer transition-colors ${isSelected
                    ? 'bg-blue-50/60'
                    : 'hover:bg-slate-50/80'
                    }`}
                >
                  <td className="px-3 py-2">
                    {task.delegatedJobId ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold font-mono border border-blue-100">
                        {task.delegatedJobId}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[200px]">
                    <div className="text-[12px] font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate" title={task.jobTitle}>
                      {task.jobTitle}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{task.company}</div>
                  </td>
                  <td className="px-3 py-2">
                    {task.labels && task.labels.length > 0 ? (
                      <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                        {task.labels.slice(0, 2).map((label) => (
                          <span key={label} className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border whitespace-nowrap ${getLabelClasses(label)}`}>
                            {label}
                          </span>
                        ))}
                        {task.labels.length > 2 && (
                          <span className="text-[8px] font-bold text-slate-400">+{task.labels.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="text-[11px] font-semibold text-slate-900 truncate max-w-[100px]" title={task.clientName}>{task.clientName}</div>
                      {task.profileUpdatedAt && task.createdAt && new Date(task.profileUpdatedAt) > new Date(task.createdAt) && (
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Profile updated"></div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[120px]">{task.clientEmail}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-[11px] font-medium text-slate-700">
                      {new Date(task.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.isOverdue ? (
                          <>
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            Priority
                          </>
                        ) : (
                          task.status
                        )}
                      </span>
                      {task.isOverdue && task.previousAssigneeName && (
                        <span className="text-[8px] text-slate-400 italic">
                          Was: {task.previousAssigneeName.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {getAIStatusBadge(task.aiStatus)}
                  </td>
                  <td className="px-3 py-2">
                    {task.assignedTo ? (
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-bold uppercase ${task.assignedTo === currentUserId ? 'text-blue-600' : 'text-slate-500'}`}>
                          {task.assignedTo === currentUserId ? 'Me' : task.assignedToName?.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300 uppercase italic">-</span>
                    )}
                  </td>
                  {showProofColumn && (
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {task.proofOfWork?.screenshotUrl ? (
                          <a
                            href={`/api/resume/view?path=${encodeURIComponent(task.proofOfWork.screenshotUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            Proof <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : null}
                        {task.proofOfWork?.customResumeUrl && (
                          <a
                            href={`/api/resume/view?path=${encodeURIComponent(task.proofOfWork.customResumeUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded hover:bg-emerald-100 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            Resume <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                        {!task.proofOfWork?.screenshotUrl && !task.proofOfWork?.customResumeUrl && (
                          <span className="text-[9px] text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                  )}
                  {showCannotApplyReason && (
                    <td className="px-3 py-2">
                      <span className="text-[10px] text-slate-600 max-w-[150px] truncate block" title={task.cannotApplyReason}>
                        {task.cannotApplyReason || '-'}
                      </span>
                    </td>
                  )}
                  {(onCannotApply || (onClaimTask && !task.assignedTo)) && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {onClaimTask && !task.assignedTo && (task.status === 'Applying' || task.isOverdue) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!claimDisabled) onClaimTask(task);
                            }}
                            disabled={claimDisabled}
                            className={`inline-flex items-center px-2 py-1 text-[9px] font-bold uppercase rounded transition-colors ${claimDisabled
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'text-white bg-blue-600 hover:bg-blue-700'
                              }`}
                            title={claimDisabled ? `Limit: ${activeClaimCount}/${maxClaims}` : 'Claim'}
                          >
                            Claim
                          </button>
                        )}
                        {onCannotApply && (task.status === 'Applying' || task.isOverdue) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCannotApply(task);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase text-red-600 bg-red-50 border border-red-100 rounded hover:bg-red-100 transition-colors"
                            title="Can't Apply"
                          >
                            <Ban className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
