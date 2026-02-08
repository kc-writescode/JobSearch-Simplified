'use client';

import React, { useState, useRef } from 'react';
import {
    X,
    Upload,
    FileText,
    Mail,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Download,
    Globe,
    Flame
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ResumeUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    toolId: string | null;
}

export function ResumeUploadModal({ isOpen, onClose, toolId }: ResumeUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toolResult, setToolResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf' ||
                selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                setFile(selectedFile);
                setError(null);
            } else {
                setError('Please upload a PDF or DOCX file.');
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !email) {
            setError('Please provide both your resume and email.');
            return;
        }

        setLoading(true);
        setError(null);
        setStep('processing');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('email', email);
            formData.append('name', name);
            formData.append('toolId', toolId || '');

            const response = await fetch('/api/tools/process', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to process resume');
            }

            const result = await response.json();
            setToolResult(result.data);
            setStep('result');
            toast.success('Resume processed successfully!');

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setEmail('');
        setName('');
        setStep('upload');
        setToolResult(null);
        setError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none rounded-[2.5rem] shadow-2xl">
                <div className="p-8">
                    {step === 'upload' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Step into the spotlight</h2>
                                <p className="text-slate-500 font-medium italic">Upload your resume to see the magic happen</p>
                            </div>

                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="lead-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Full Name (Optional)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="lead-name"
                                                    placeholder="John Doe"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="pl-4 pr-4 py-6 bg-slate-50 border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-slate-100 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lead-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="lead-email"
                                                    type="email"
                                                    required
                                                    placeholder="john@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pl-12 pr-4 py-6 bg-slate-50 border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-slate-100 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Your Professional Weapon (Resume)</Label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative h-48 border-2 border-dashed rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer group ${file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept=".pdf,.docx"
                                            />
                                            {file ? (
                                                <>
                                                    <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
                                                        <FileText className="h-8 w-8" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-black text-emerald-700">{file.name}</p>
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Selected • Click to change</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                        <Upload className="h-8 w-8" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-black text-slate-900 leading-tight">Drop your resume here</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF or DOCX • Max 10MB</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 flex gap-3 animate-in shake-in duration-300">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        <p className="text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !file || !email}
                                    className="w-full py-8 text-lg font-black uppercase tracking-widest bg-slate-900 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 border-b-4 border-slate-700 hover:border-blue-800"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                            Initializing Magic...
                                        </>
                                    ) : (
                                        <>
                                            Unleash the Insight
                                            <ArrowRight className="h-6 w-6 ml-2" />
                                        </>
                                    )}
                                </Button>

                                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest italic">
                                    By uploading, you agree to our Terms of Service. We respect your privacy.
                                </p>
                            </form>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500">
                            <div className="relative">
                                <div className="h-32 w-32 border-8 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Loader2 className="h-10 w-10 text-blue-600 animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-3">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Analyzing Your DNA</h3>
                                <p className="text-slate-500 font-medium italic">Our AI is parsing your professional journey...</p>
                            </div>
                            <div className="w-full max-w-xs space-y-4">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Intelligence Extraction</span>
                                    <span className="animate-pulse">Active</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-[progress_3s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analysis Complete!</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={reset}
                                    className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Start Over
                                </Button>
                            </div>

                            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner">
                                {toolId === 'ats-checker' && <ATSResult data={toolResult} />}
                                {toolId === 'netflix-career' && <NetflixResult data={toolResult} />}
                                {toolId === 'wikipedia-page' && <WikipediaResult data={toolResult} />}
                                {toolId === 'resume-roast' && <RoastResult data={toolResult} />}
                                {!['ats-checker', 'netflix-career', 'wikipedia-page', 'resume-roast'].includes(toolId || '') && (
                                    <div className="text-center py-10 space-y-4">
                                        <div className="p-4 bg-blue-100 rounded-3xl inline-block text-blue-600">
                                            <FileText className="h-10 w-10" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900">Custom Tool Insights</h4>
                                        <p className="text-slate-500 font-medium italic">We've generated a custom insight based on your tool selection.</p>
                                        <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-left whitespace-pre-wrap font-medium text-slate-600 leading-relaxed">
                                            {JSON.stringify(toolResult, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button className="flex-1 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-xl transition-all">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Full Report
                                </Button>
                                <Button variant="outline" className="flex-1 py-6 border-slate-200 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Share with Friends
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Result Components
function ATSResult({ data }: any) {
    const score = data.score || 85;
    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative h-40 w-40 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90">
                        <circle cx="80" cy="80" r="70" className="stroke-slate-200" strokeWidth="12" fill="none" />
                        <circle
                            cx="80" cy="80" r="70"
                            className="stroke-emerald-500"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * score / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">{score}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Score</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900 uppercase">Strategic Superiority</h4>
                    <p className="text-sm text-slate-500 font-medium italic">Your resume is optimized for modern recruitment engines.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Findings</p>
                    <ul className="space-y-1.5">
                        {data.positives?.map((p: string, i: number) => (
                            <li key={i} className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" />
                                {p}
                            </li>
                        )) || [
                                <li key={0} className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" />Keyword density: High</li>,
                                <li key={1} className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" />Formatting: Clean</li>
                            ]}
                    </ul>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Critical Gaps</p>
                    <ul className="space-y-1.5">
                        {data.negatives?.map((n: string, i: number) => (
                            <li key={i} className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3" />
                                {n}
                            </li>
                        )) || [
                                <li key={0} className="text-xs font-bold text-rose-500 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" />Missing: Docker, Cloud</li>,
                                <li key={1} className="text-xs font-bold text-rose-500 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" />No Action Verbs</li>
                            ]}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function NetflixResult({ data }: any) {
    return (
        <div className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group">
                <img
                    src={data.poster_url || "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1000&auto=format&fit=crop"}
                    alt="Netflix Series"
                    className="w-full h-full object-cover brightness-50"
                />
                <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-transparent to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" className="h-6" alt="Netflix" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-rose-600 px-2 py-0.5 rounded">Series</span>
                    </div>
                    <h4 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">{data.title || "The Product Architect"}</h4>
                    <p className="text-lg text-slate-300 font-bold italic leading-tight">{data.tagline || "One vision. 10,000 users. Too many bugs."}</p>
                </div>
                <div className="absolute top-4 right-4 animate-pulse">
                    <div className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-2 border-white shadow-lg">New Episode</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-4 text-white">
                    <span className="text-emerald-500 font-black text-sm">98% Match</span>
                    <span className="text-slate-400 text-sm font-bold">2024</span>
                    <span className="border border-slate-700 px-1 text-[10px] text-slate-400 rounded">16+</span>
                    <span className="text-slate-400 text-sm font-bold">12 Seasons</span>
                </div>
                <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                    {data.description || "In a world of legacy code, one engineer dares to refactor the entire monolith. Witness the rise of a visionary as they navigate through morning standups, mysterious outages, and the quest for the perfect pull request."}
                </p>
                <div className="pt-2">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">Cast</p>
                    <p className="text-xs text-slate-400 font-bold">{data.cast || "Senior React Dev, Junior Node Ninja, Frustrated PM"}</p>
                </div>
            </div>
        </div>
    );
}

function WikipediaResult({ data }: any) {
    return (
        <div className="bg-white border rounded-lg p-6 font-serif text-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
                <Globe className="h-32 w-32" />
            </div>
            <div className="border-b-2 border-slate-200 pb-2 mb-4">
                <h4 className="text-4xl font-medium">{data.full_name || "Anonymous Professional"}</h4>
                <p className="text-xs mt-1 text-slate-500 italic">From Wikipedia, the free encyclopedia</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <p className="text-sm leading-relaxed">
                        <span className="font-bold">{data.full_name || "Anonymous"}</span> {data.intro || "is a distinguished professional known for their significant contributions to the field of software engineering and digital transformation."}
                    </p>
                    <div className="bg-slate-50 rounded p-4 border border-slate-100">
                        <p className="text-xs font-bold text-slate-600 mb-2">Contents</p>
                        <ul className="text-xs space-y-1 text-blue-600">
                            <li>1 Early Life and Career</li>
                            <li>2 Notable Projects</li>
                            <li>3 Impact and Legacy</li>
                            <li>4 References</li>
                        </ul>
                    </div>
                    <h5 className="text-lg font-bold border-b border-slate-100 pb-1 pt-2">Career</h5>
                    <p className="text-sm leading-relaxed italic">
                        {data.career_summary || "Starting their journey in late 2018, they quickly established a reputation for excellence in technical leadership and architectural design..."}
                    </p>
                </div>

                <div className="w-56 border p-2 bg-slate-50 rounded shrink-0">
                    <div className="bg-white border h-48 mb-2 flex items-center justify-center text-slate-300">
                        <FileText className="h-12 w-12" />
                    </div>
                    <p className="text-[10px] font-black text-center uppercase tracking-tight mb-2">Technical Profile</p>
                    <table className="w-full text-[10px] border-collapse">
                        <tbody>
                            <tr className="border-t">
                                <th className="text-left py-1 pr-2 w-1/2">Role</th>
                                <td className="py-1">{data.role || "Architect"}</td>
                            </tr>
                            <tr className="border-t">
                                <th className="text-left py-1 pr-2">Stack</th>
                                <td className="py-1">{data.stack || "React, Node, Postgres"}</td>
                            </tr>
                            <tr className="border-t">
                                <th className="text-left py-1 pr-2">XP</th>
                                <td className="py-1">{data.years_experience || "6+ Years"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function RoastResult({ data }: any) {
    return (
        <div className="space-y-6 relative overflow-hidden p-4">
            <div className="absolute top-0 right-0 -rotate-12 opacity-10">
                <Flame className="h-32 w-32 text-rose-500" />
            </div>
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Flame className="h-6 w-6 animate-bounce" />
                </div>
                <div>
                    <h4 className="text-2xl font-black text-rose-600 tracking-tighter uppercase italic">Emotional Damage</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Brutally honest feedback</p>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="p-6 bg-rose-50 rounded-2xl border-2 border-rose-100 relative">
                    <div className="absolute -top-3 -left-3 h-8 w-8 bg-rose-500 rounded-lg flex items-center justify-center text-white font-black">1</div>
                    <p className="text-sm font-black text-rose-700 leading-relaxed italic">
                        "{data.roast_1 || "I've seen better formatting on a grocery receipt. The mixed use of bullet points and hyphens is making me question your attention to detail and my sanity."}"
                    </p>
                </div>
                <div className="p-6 bg-slate-900 rounded-2xl border-2 border-slate-800 relative">
                    <div className="absolute -top-3 -left-3 h-8 w-8 bg-slate-700 rounded-lg flex items-center justify-center text-white font-black">2</div>
                    <p className="text-sm font-black text-slate-300 leading-relaxed italic">
                        "{data.roast_2 || "Calling yourself 'passionate' is the professional equivalent of saying you like breathing. Find some actual skills or at least better buzzwords."}"
                    </p>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 relative">
                    <div className="absolute -top-3 -left-3 h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-black">3</div>
                    <p className="text-sm font-black text-amber-700 leading-relaxed italic">
                        "{data.roast_3 || "A 4-page resume? I didn't know you were writing a memoir. Recruiter eyes glazed over by page 2, and so did mine."}"
                    </p>
                </div>
            </div>

            <div className="pt-4 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Survival Rating: 3/10</p>
            </div>
        </div>
    );
}
