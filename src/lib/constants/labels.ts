export interface LabelPreset {
    name: string;
    color: string; // Tailwind color name (blue, green, red, amber, slate, purple)
}

export const PRESET_LABELS: LabelPreset[] = [
    { name: 'Apply First', color: 'blue' },
    { name: 'Got a Call', color: 'green' },
    { name: 'Rejected', color: 'red' },
    { name: 'Follow Up', color: 'amber' },
    { name: 'On Hold', color: 'slate' },
    { name: 'Interview Scheduled', color: 'purple' },
];

const COLOR_MAP: Record<string, string> = Object.fromEntries(
    PRESET_LABELS.map((l) => [l.name, l.color])
);

export function getLabelColor(label: string): string {
    return COLOR_MAP[label] || 'gray';
}

/** Tailwind class map for label badges */
export function getLabelClasses(label: string): string {
    const color = getLabelColor(label);
    const map: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        red: 'bg-red-100 text-red-700 border-red-200',
        amber: 'bg-amber-100 text-amber-700 border-amber-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
        gray: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return map[color] || map.gray;
}
