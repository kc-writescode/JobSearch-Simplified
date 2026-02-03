'use client';

import React, { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Briefcase,
  MapPin,
  GraduationCap,
  Globe,
  ShieldCheck,
  Users,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Languages,
  Clock,
  Heart,
  Plus,
  X,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface SkillCategory {
  category: string;
  items: string[];
}

interface PersonalDetailsFormProps {
  readonly initialData?: any;
  readonly initialResumeSkills?: SkillCategory[];
  readonly onUpdate?: () => void;
}

interface FormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  password_applications: string;
  date_of_birth: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  county: string;
  country: string;
  state: string;
  zipcode: string;
  desired_salary: string;
  desired_salary_range: string;
  university: string;
  field_of_study: string;
  degree: string;
  gpa: string;
  education_from: string;
  education_to: string;
  is_us_citizen: string;
  eligible_to_work_us: string;
  needs_sponsorship: string;
  sponsorship_type: string;
  visa_status_explanation: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  start_date: string;
  willing_to_relocate: string;
  travel_percentage: string;
  experience_travel: string;
  able_overtime: string;
  languages: string;
  security_clearance: string;
  citizenship_status: string;
  nationality: string;
  authorized_work: string;
  visa_start_date: string;
  visa_expiration_date: string;
  h1b_info: string;
  preferred_cities: string;
  preferred_shift: string;
  preferred_days: string;
  current_salary: string;
  notice_period: string;
  is_veteran: string;
  ethnicity: string;
  gender: string;
  sexual_orientation: string;
  disabilities: string;
  driving_license: string;
  ssn: string;
  linkedin_email: string;
  linkedin_password: string;
  security_q1: string;
  security_a1: string;
  security_q2: string;
  security_a2: string;
  security_q3: string;
  security_a3: string;
  references: Array<{
    name: string;
    email: string;
    position: string;
    relationship: string;
    phone: string;
  }>;
  work_experience: Array<{
    company_name: string;
    job_title: string;
    location: string;
    experience_type: string;
    start_date: string;
    end_date: string;
    currently_working: boolean;
    description: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
}

const DEFAULT_FORM_DATA: FormData = {
  first_name: '', middle_name: '', last_name: '', email: '', password_applications: '', date_of_birth: '', phone: '',
  address_line_1: '', address_line_2: '', city: '', county: '', country: '', state: '', zipcode: '',
  desired_salary: '', desired_salary_range: '', university: '', field_of_study: '', degree: '', gpa: '', education_from: '', education_to: '',
  is_us_citizen: '', eligible_to_work_us: '', needs_sponsorship: '', sponsorship_type: '', visa_status_explanation: '', linkedin_url: '', github_url: '', portfolio_url: '', start_date: '', willing_to_relocate: '', travel_percentage: '0', experience_travel: '', able_overtime: '', languages: '', security_clearance: '',
  citizenship_status: '', nationality: '', authorized_work: '', visa_start_date: '', visa_expiration_date: '', h1b_info: '', preferred_cities: '', preferred_shift: '', preferred_days: '', current_salary: '', notice_period: '',
  is_veteran: '', ethnicity: '', gender: '', sexual_orientation: '', disabilities: '', driving_license: '', ssn: '', linkedin_email: '', linkedin_password: '',
  security_q1: 'What is the name of your first school?', security_a1: '', security_q2: 'What is your favourite vacation spot?', security_a2: '', security_q3: "What is your mother's maiden name?", security_a3: '',
  references: [{ name: '', email: '', position: '', relationship: '', phone: '' }, { name: '', email: '', position: '', relationship: '', phone: '' }, { name: '', email: '', position: '', relationship: '', phone: '' }],
  work_experience: [{ company_name: '', job_title: '', location: '', experience_type: '', start_date: '', end_date: '', currently_working: false, description: '' }],
  skills: [],
};

const YES_NO_OPTIONS = [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }];

interface FormSectionProps {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
  readonly description?: string;
}

const FormSection = React.memo(({ title, icon, expanded, onToggle, children, description }: FormSectionProps) => (
  <div className={cn(
    "bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden mb-6",
    expanded ? "border-blue-200 shadow-xl shadow-blue-500/5" : "border-slate-100 hover:border-slate-200 shadow-sm"
  )}>
    <button
      onClick={onToggle}
      className={cn(
        "w-full px-8 py-6 flex items-center justify-between transition-all",
        expanded ? "bg-slate-50/50" : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={cn(
          "p-3 rounded-2xl transition-all duration-500",
          expanded ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
        )}>
          {icon}
        </div>
        <div className="text-left">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">{title}</h3>
          {description && (
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{description}</p>
          )}
        </div>
      </div>
      <div className={cn(
        "h-10 w-10 flex items-center justify-center rounded-full border border-slate-100 transition-all",
        expanded ? "rotate-180 bg-white shadow-sm border-blue-100" : ""
      )}>
        <ChevronDown className={cn(
          "h-5 w-5 text-slate-300 transition-colors",
          expanded ? "text-blue-600" : "group-hover:text-slate-600"
        )} />
      </div>
    </button>
    <div className={cn(
      "grid transition-all duration-500 ease-in-out",
      expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
    )}>
      <div className="overflow-hidden">
        <div className="px-8 pb-10 pt-4 space-y-8 border-t border-slate-50">
          {children}
        </div>
      </div>
    </div>
  </div>
));
FormSection.displayName = 'FormSection';

interface FormFieldProps {
  readonly label: string;
  readonly type?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly options?: Array<{ label: string; value: string }>;
  readonly icon?: React.ReactNode;
}

const FormField = React.memo(({ label, type = 'text', value, onChange, placeholder = '', required = false, options, icon }: FormFieldProps) => {
  // Generate a stable ID from label to avoid hydration mismatches
  const stableId = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fieldId = `field-${stableId}`;

  const commonClasses = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white placeholder:text-slate-400";

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {icon && <span className="text-blue-500/50">{icon}</span>}
        {label}
        {required && <span className="text-rose-500 font-black">*</span>}
      </label>

      {options ? (
        <select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(commonClasses, "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2394a3b8%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%223%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_1.25rem_center] bg-no-repeat pr-12 cursor-pointer")}
        >
          <option value="">Select Protocol...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={cn(commonClasses, "resize-none")}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={commonClasses}
        />
      )}
    </div>
  );
});
FormField.displayName = 'FormField';

interface ProfileFieldProps {
  label: string;
  type?: string;
  field: keyof FormData;
  formData: FormData;
  handleInputChange: (field: string, value: any) => void;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  icon?: React.ReactNode;
}

const ProfileField = React.memo(({ field, formData, handleInputChange, ...props }: ProfileFieldProps) => {
  const fieldValue = formData[field];
  const value = typeof fieldValue === 'string' ? fieldValue : '';
  return <FormField {...props} value={value} onChange={(v) => handleInputChange(field as string, v)} />;
});
ProfileField.displayName = 'ProfileField';

export function PersonalDetailsForm({ initialData, initialResumeSkills, onUpdate }: PersonalDetailsFormProps) {
  // Initialize skills from initialData if present, otherwise from resume skills
  const getInitialSkills = () => {
    if (initialData?.skills && initialData.skills.length > 0) {
      return initialData.skills;
    }
    if (initialResumeSkills && initialResumeSkills.length > 0) {
      return initialResumeSkills;
    }
    return [];
  };

  const [formData, setFormData] = useState<FormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
    skills: getInitialSkills()
  });
  const [saving, setSaving] = useState(false);
  const [newSkillInputs, setNewSkillInputs] = useState<Record<number, string>>({});
  const [expandedSections, setExpandedSections] = useState({ personal: true, jobPreference: false, residential: false, education: false, workExperience: false, skills: false, jobProfile: false, additional: false, miscellaneous: false, security: false, references: false });
  const supabase = createClient();

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const completionPercentage = React.useMemo(() => {
    const ignoredKeys = ['references', 'preferred_shift', 'preferred_days', 'security_q1', 'security_q2', 'security_q3'];
    const textKeys = Object.keys(DEFAULT_FORM_DATA).filter(k => !ignoredKeys.includes(k));

    let filled = 0;
    textKeys.forEach(key => {
      const val = (formData as any)[key];
      if (val && String(val).trim().length > 0) filled++;
    });

    // Add weight for references
    const filledRefs = formData.references.filter(r => r.name && r.email).length;

    // Total calc: Main fields + 3 possible refs
    const total = textKeys.length + 3;
    const current = filled + filledRefs;

    return Math.min(100, Math.round((current / total) * 100));
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleReferenceChange = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => {
      const newReferences = [...prev.references];
      newReferences[index] = { ...newReferences[index], [field]: value };
      return { ...prev, references: newReferences };
    });
  }, []);

  const handleWorkExperienceChange = useCallback((index: number, field: string, value: string | boolean) => {
    setFormData(prev => {
      const newWorkExperience = [...prev.work_experience];
      newWorkExperience[index] = { ...newWorkExperience[index], [field]: value };
      return { ...prev, work_experience: newWorkExperience };
    });
  }, []);

  const addWorkExperience = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, { company_name: '', job_title: '', location: '', experience_type: '', start_date: '', end_date: '', currently_working: false, description: '' }]
    }));
  }, []);

  const removeWorkExperience = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }));
  }, []);

  // Skills handling functions
  const addSkillCategory = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { category: 'New Category', items: [] }]
    }));
  }, []);

  const removeSkillCategory = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  }, []);

  const updateSkillCategoryName = useCallback((index: number, name: string) => {
    setFormData(prev => {
      const newSkills = [...prev.skills];
      newSkills[index] = { ...newSkills[index], category: name };
      return { ...prev, skills: newSkills };
    });
  }, []);

  const addSkillToCategory = useCallback((categoryIndex: number, skill: string) => {
    if (!skill.trim()) return;
    setFormData(prev => {
      const newSkills = [...prev.skills];
      if (!newSkills[categoryIndex].items.includes(skill.trim())) {
        newSkills[categoryIndex] = {
          ...newSkills[categoryIndex],
          items: [...newSkills[categoryIndex].items, skill.trim()]
        };
      }
      return { ...prev, skills: newSkills };
    });
  }, []);

  const removeSkillFromCategory = useCallback((categoryIndex: number, skillIndex: number) => {
    setFormData(prev => {
      const newSkills = [...prev.skills];
      newSkills[categoryIndex] = {
        ...newSkills[categoryIndex],
        items: newSkills[categoryIndex].items.filter((_, i) => i !== skillIndex)
      };
      return { ...prev, skills: newSkills };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError.message);
        toast.error('Authentication error. Please log in again.');
        return;
      }
      if (!user) {
        toast.error('You must be logged in to save.');
        return;
      }
      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          personal_details: formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase error:', error.message, error.details, error.hint);
        toast.error(`Error saving profile: ${error.message}`);
        return;
      }
      toast.success('Profile saved successfully!');
      onUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving profile:', errorMessage);
      toast.error(`Error saving profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [formData, supabase, onUpdate]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4" suppressHydrationWarning>


      <div className="mb-8 flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Strength</span>
            <span className="text-xs font-black text-slate-700">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-out rounded-full",
                completionPercentage < 30 ? "bg-red-400" : completionPercentage < 70 ? "bg-amber-400" : "bg-gradient-to-r from-blue-500 to-indigo-600"
              )}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide hidden sm:block max-w-[200px] text-center leading-tight">
          Crucial for Virtual Assistants to fill applications accurately
        </p>
      </div>



      <FormSection
        title="Personal Information"
        icon={<User className="h-5 w-5" />}
        expanded={expandedSections.personal}
        onToggle={() => toggleSection('personal')}
        description="Name, contact details and basic info"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProfileField label="First Name" field="first_name" formData={formData} handleInputChange={handleInputChange} placeholder="John" />
          <ProfileField label="Middle Name" field="middle_name" formData={formData} handleInputChange={handleInputChange} placeholder="Quincy" />
          <ProfileField label="Last Name" field="last_name" formData={formData} handleInputChange={handleInputChange} placeholder="Doe" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Email Address" field="email" type="email" formData={formData} handleInputChange={handleInputChange} placeholder="john.doe@example.com" />
          <ProfileField label="Phone Number" field="phone" type="tel" formData={formData} handleInputChange={handleInputChange} placeholder="+1 (555) 000-0000" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Date of Birth" field="date_of_birth" type="date" formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Password to be used in Applications" field="password_applications" type="text" formData={formData} handleInputChange={handleInputChange} placeholder="Password123!" />
        </div>
      </FormSection>

      <FormSection
        title="Residential Information"
        icon={<MapPin className="h-5 w-5" />}
        expanded={expandedSections.residential}
        onToggle={() => toggleSection('residential')}
        description="Current address and location details"
      >
        <div className="grid grid-cols-1 gap-6">
          <ProfileField label="Address Line 1" field="address_line_1" formData={formData} handleInputChange={handleInputChange} placeholder="123 Main St" />
          <ProfileField label="Address Line 2" field="address_line_2" formData={formData} handleInputChange={handleInputChange} placeholder="Apt 4B" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProfileField label="City" field="city" formData={formData} handleInputChange={handleInputChange} placeholder="New York" />
          <ProfileField label="State / Province" field="state" formData={formData} handleInputChange={handleInputChange} placeholder="NY" />
          <ProfileField label="Zip / Postal Code" field="zipcode" formData={formData} handleInputChange={handleInputChange} placeholder="10001" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Country" field="country" formData={formData} handleInputChange={handleInputChange} placeholder="United States" />
          <ProfileField label="County" field="county" formData={formData} handleInputChange={handleInputChange} placeholder="Manhattan" />
        </div>
      </FormSection>

      <FormSection
        title="Job Preferences"
        icon={<Briefcase className="h-5 w-5" />}
        expanded={expandedSections.jobPreference}
        onToggle={() => toggleSection('jobPreference')}
        description="Expected salary and compensation"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Desired Salary (Annual)" field="desired_salary" formData={formData} handleInputChange={handleInputChange} placeholder="e.g. $120,000" />
          <ProfileField label="Desired Hourly Rate" field="desired_salary_range" formData={formData} handleInputChange={handleInputChange} placeholder="e.g. $60/hr" />
        </div>
      </FormSection>

      <FormSection
        title="Education Details"
        icon={<GraduationCap className="h-5 w-5" />}
        expanded={expandedSections.education}
        onToggle={() => toggleSection('education')}
        description="University, degree and academic performance"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="University / College" field="university" formData={formData} handleInputChange={handleInputChange} placeholder="Stanford University" />
          <ProfileField label="Field of Study" field="field_of_study" formData={formData} handleInputChange={handleInputChange} placeholder="Computer Science" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Degree" field="degree" formData={formData} handleInputChange={handleInputChange} placeholder="Bachelor of Science" />
          <ProfileField label="GPA" field="gpa" formData={formData} handleInputChange={handleInputChange} placeholder="3.8 / 4.0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Started On" field="education_from" type="date" formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Graduated On" field="education_to" type="date" formData={formData} handleInputChange={handleInputChange} />
        </div>
      </FormSection>

      <FormSection
        title="Work Experience"
        icon={<Building2 className="h-5 w-5" />}
        expanded={expandedSections.workExperience}
        onToggle={() => toggleSection('workExperience')}
        description="Employment history for applications"
      >
        <div className="space-y-6">
          {formData.work_experience.map((exp, index) => (
            <div key={`exp-${index}`} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 relative group transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
              {formData.work_experience.length > 1 && (
                <button
                  onClick={() => removeWorkExperience(index)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove this experience"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="absolute -top-3 left-4 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-500 group-hover:border-blue-100 transition-colors">
                Experience {index + 1}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                <FormField label="Company Name" value={exp.company_name} onChange={(v) => handleWorkExperienceChange(index, 'company_name', v)} placeholder="Company Name" required />
                <FormField label="Job Title" value={exp.job_title} onChange={(v) => handleWorkExperienceChange(index, 'job_title', v)} placeholder="Job Title" required />
                <FormField label="Location (city, state, country)" value={exp.location} onChange={(v) => handleWorkExperienceChange(index, 'location', v)} placeholder="e.g., Chicago, IL, USA" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Experience Type
                  </label>
                  <select
                    value={exp.experience_type}
                    onChange={(e) => handleWorkExperienceChange(index, 'experience_type', e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2394a3b8%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%223%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_1.25rem_center] bg-no-repeat pr-12 cursor-pointer"
                  >
                    <option value="">Select type...</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <FormField label="Start Date" type="date" value={exp.start_date} onChange={(v) => handleWorkExperienceChange(index, 'start_date', v)} required />
                <div className="space-y-2">
                  <FormField
                    label="End Date"
                    type="date"
                    value={exp.end_date}
                    onChange={(v) => handleWorkExperienceChange(index, 'end_date', v)}
                    required={!exp.currently_working}
                  />
                  <label className="flex items-center gap-2 cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={exp.currently_working}
                      onChange={(e) => {
                        handleWorkExperienceChange(index, 'currently_working', e.target.checked);
                        if (e.target.checked) {
                          handleWorkExperienceChange(index, 'end_date', '');
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-500">I currently work here</span>
                  </label>
                </div>
              </div>
              <div className="mt-6">
                <FormField
                  label="Job Description (can use bullet points as well)"
                  type="textarea"
                  value={exp.description}
                  onChange={(v) => handleWorkExperienceChange(index, 'description', v)}
                  placeholder="Describe your responsibilities and achievements..."
                  required
                />
              </div>
            </div>
          ))}
          <button
            onClick={addWorkExperience}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Work Experience
          </button>
        </div>
      </FormSection>

      <FormSection
        title="Skills"
        icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
        expanded={expandedSections.skills}
        onToggle={() => toggleSection('skills')}
        description="Technical skills and competencies from your resume"
      >
        <div className="space-y-6">
          {formData.skills.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-500 mb-4">No skills added yet. Add a category to get started.</p>
              <button
                onClick={addSkillCategory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Skill Category
              </button>
            </div>
          ) : (
            <>
              {formData.skills.map((skillGroup, categoryIndex) => (
                <div key={`skill-cat-${categoryIndex}`} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 relative group transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                  <button
                    onClick={() => removeSkillCategory(categoryIndex)}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove this category"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Category Name</label>
                    <input
                      type="text"
                      value={skillGroup.category}
                      onChange={(e) => updateSkillCategoryName(categoryIndex, e.target.value)}
                      className="w-full max-w-xs px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      placeholder="e.g., Technical, Languages, Tools"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.items.map((skill, skillIndex) => (
                        <span
                          key={`skill-${categoryIndex}-${skillIndex}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 group/skill hover:border-red-200 hover:bg-red-50 transition-all"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkillFromCategory(categoryIndex, skillIndex)}
                            className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove skill"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={newSkillInputs[categoryIndex] || ''}
                        onChange={(e) => setNewSkillInputs(prev => ({ ...prev, [categoryIndex]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkillToCategory(categoryIndex, newSkillInputs[categoryIndex] || '');
                            setNewSkillInputs(prev => ({ ...prev, [categoryIndex]: '' }));
                          }
                        }}
                        className="flex-1 max-w-xs px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        placeholder="Type a skill and press Enter"
                      />
                      <button
                        onClick={() => {
                          addSkillToCategory(categoryIndex, newSkillInputs[categoryIndex] || '');
                          setNewSkillInputs(prev => ({ ...prev, [categoryIndex]: '' }));
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addSkillCategory}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Skill Category
              </button>
            </>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Work Authorization"
        icon={<ShieldCheck className="h-5 w-5" />}
        expanded={expandedSections.jobProfile}
        onToggle={() => toggleSection('jobProfile')}
        description="Citizenship and visa status details"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="US Citizen?" field="is_us_citizen" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Currently Eligible to Work in US?" field="eligible_to_work_us" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Will need sponsorship?" field="needs_sponsorship" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Sponsorship Type" field="sponsorship_type" formData={formData} handleInputChange={handleInputChange} placeholder="H1B, L1, or NA" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Security Clearance" field="security_clearance" options={[
            { label: 'Has clearance', value: 'has_clearance' },
            { label: 'Can obtain', value: 'can_obtain' },
            { label: 'None / Not Interested', value: 'not_interested' }
          ]} formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Explain Visa Status" field="visa_status_explanation" formData={formData} handleInputChange={handleInputChange} placeholder="Explain your current work permit status if applicable..." />
        </div>
      </FormSection>

      <FormSection
        title="Social & Links"
        icon={<Globe className="h-5 w-5" />}
        expanded={expandedSections.additional}
        onToggle={() => toggleSection('additional')}
        description="LinkedIn, GitHub and portfolio links"
      >
        <div className="grid grid-cols-1 gap-6">
          <ProfileField label="LinkedIn Profile" field="linkedin_url" type="url" formData={formData} handleInputChange={handleInputChange} placeholder="https://linkedin.com/in/username" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="GitHub Profile" field="github_url" type="url" formData={formData} handleInputChange={handleInputChange} placeholder="https://github.com/username" />
            <ProfileField label="Portfolio / Website" field="portfolio_url" type="url" formData={formData} handleInputChange={handleInputChange} placeholder="https://yourwebsite.com" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="LinkedIn Login Email" field="linkedin_email" type="email" formData={formData} handleInputChange={handleInputChange} placeholder="Optional" />
            <ProfileField label="LinkedIn Password" field="linkedin_password" type="password" formData={formData} handleInputChange={handleInputChange} placeholder="Optional" />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Availability & Flexibility"
        icon={<Clock className="h-5 w-5" />}
        expanded={expandedSections.miscellaneous}
        onToggle={() => toggleSection('miscellaneous')}
        description="Travel, orientation and shift preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Available Start Date" field="start_date" type="date" formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Willing to Relocate?" field="willing_to_relocate" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Willing to Travel (%)" field="travel_percentage" type="number" formData={formData} handleInputChange={handleInputChange} placeholder="0-100" />
          <ProfileField label="Extensive Travel Experience?" field="experience_travel" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Able to work Overtime?" field="able_overtime" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Preferred Shift" field="preferred_shift" options={[
            { label: 'Morning', value: 'morning' },
            { label: 'Afternoon', value: 'afternoon' },
            { label: 'Evening', value: 'evening' },
            { label: 'Night', value: 'night' }
          ]} formData={formData} handleInputChange={handleInputChange} />
        </div>
      </FormSection>

      <FormSection
        title="Diversity & Military"
        icon={<Heart className="h-5 w-5" />}
        expanded={expandedSections.miscellaneous}
        onToggle={() => toggleSection('miscellaneous')}
        description="Optional demographic information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Veteran Status" field="is_veteran" options={YES_NO_OPTIONS} formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Ethnicity" field="ethnicity" formData={formData} handleInputChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Gender" field="gender" formData={formData} handleInputChange={handleInputChange} />
          <ProfileField label="Sexual Orientation" field="sexual_orientation" formData={formData} handleInputChange={handleInputChange} />
        </div>
        <ProfileField label="Disabilities (if any)" field="disabilities" type="textarea" formData={formData} handleInputChange={handleInputChange} placeholder="Optional..." />
      </FormSection>

      <FormSection
        title="Identification & Security"
        icon={<ShieldCheck className="h-5 w-5" />}
        expanded={expandedSections.security}
        onToggle={() => toggleSection('security')}
        description="Identification numbers and security questions"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="SSN Number" field="ssn" formData={formData} handleInputChange={handleInputChange} placeholder="XXX-XX-XXXX" />
          <ProfileField label="Driving License" field="driving_license" formData={formData} handleInputChange={handleInputChange} placeholder="Type and Number" />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            Active Security Questions
          </p>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-400">Question 1</label>
                <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500">{formData.security_q1}</div>
              </div>
              <ProfileField label="Answer 1" field="security_a1" formData={formData} handleInputChange={handleInputChange} placeholder="Your answer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-400">Question 2</label>
                <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500">{formData.security_q2}</div>
              </div>
              <ProfileField label="Answer 2" field="security_a2" formData={formData} handleInputChange={handleInputChange} placeholder="Your answer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-400">Question 3</label>
                <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500">{formData.security_q3}</div>
              </div>
              <ProfileField label="Answer 3" field="security_a3" formData={formData} handleInputChange={handleInputChange} placeholder="Your answer" />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Professional References"
        icon={<Users className="h-5 w-5" />}
        expanded={expandedSections.references}
        onToggle={() => toggleSection('references')}
        description="People who can vouch for your work"
      >
        <div className="space-y-8">
          {formData.references.map((ref, index) => (
            <div key={`ref-${index}`} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 relative group transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-500 group-hover:border-blue-100 transition-colors">
                Reference {index + 1}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <FormField label="Full Name" value={ref.name} onChange={(v) => handleReferenceChange(index, 'name', v)} placeholder="Jane Smith" />
                <FormField label="Email" value={ref.email} type="email" onChange={(v) => handleReferenceChange(index, 'email', v)} placeholder="jane.smith@company.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <FormField label="Position" value={ref.position} onChange={(v) => handleReferenceChange(index, 'position', v)} placeholder="Senior Manager" />
                <FormField label="Relationship" value={ref.relationship} onChange={(v) => handleReferenceChange(index, 'relationship', v)} placeholder="Former Supervisor" />
                <FormField label="Phone" value={ref.phone} type="tel" onChange={(v) => handleReferenceChange(index, 'phone', v)} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Simple Floating Save */}
      {/* Unified Floating Save Dock */}
      <div className="fixed bottom-8 left-0 right-0 lg:left-64 z-50 flex justify-center pointer-events-none px-6">
        <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-slate-200/40 p-1.5 pl-5 pr-1.5 rounded-full flex items-center gap-6 transition-all hover:bg-white hover:shadow-xl hover:scale-[1.01] group">

          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700 transition-colors">Save Manually</span>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "h-10 px-6 rounded-full font-black text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
              saving
                ? "bg-slate-100 text-slate-400 border border-slate-100"
                : "bg-slate-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20"
            )}
          >
            {saving ? (
              <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
