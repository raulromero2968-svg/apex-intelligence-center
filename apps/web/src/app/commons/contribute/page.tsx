'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { trpc } from '@/lib/trpc';
import {
  COMMONS_SUBJECTS,
  COMMONS_GRADE_LEVELS,
  COMMONS_CATEGORIES,
  COMMONS_RESOURCE_TYPES,
  QUALITY_GUIDELINES,
} from '@/lib/commons/constants';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  title: string;
  description: string;
  category: string;
  subject: string;
  gradeLevel: string;
  resourceType: string;
  files: { name: string; url: string; type: string; size: number }[];
  thumbnailUrl: string;
  tags: string[];
  standards: string[];
  duration: number | null;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  category: '',
  subject: '',
  gradeLevel: '',
  resourceType: '',
  files: [],
  thumbnailUrl: '',
  tags: [],
  standards: [],
  duration: null,
};

export default function ContributePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [standardInput, setStandardInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: profile } = trpc.commons.user.getCurrentProfile.useQuery();
  const createResourceMutation = trpc.commons.resource.create.useMutation({
    onSuccess: () => {
      router.push('/commons/dashboard?success=resource_submitted');
    },
  });

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'moderator' || profile?.role === 'admin';

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      updateField('tags', [...formData.tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  };

  const addStandard = () => {
    const standard = standardInput.trim();
    if (standard && !formData.standards.includes(standard)) {
      updateField('standards', [...formData.standards, standard]);
      setStandardInput('');
    }
  };

  const removeStandard = (standard: string) => {
    updateField('standards', formData.standards.filter((s) => s !== standard));
  };

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.subject) newErrors.subject = 'Subject is required';
      if (!formData.gradeLevel) newErrors.gradeLevel = 'Grade level is required';
    }

    if (currentStep === 2) {
      if (formData.files.length === 0) newErrors.files = 'At least one file is required';
      if (!formData.resourceType) newErrors.resourceType = 'Resource type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4) as Step);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    try {
      await createResourceMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        subject: formData.subject as any,
        gradeLevel: formData.gradeLevel as any,
        resourceType: formData.resourceType as any,
        files: formData.files,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        tags: formData.tags,
        standards: formData.standards,
        duration: formData.duration ?? undefined,
      });
    } catch (err) {
      console.error('Failed to submit resource:', err);
    }
  };

  // Placeholder file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, this would upload to a storage service
    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file), // Placeholder
      type: file.type,
      size: file.size,
    }));

    updateField('files', [...formData.files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    updateField('files', formData.files.filter((_, i) => i !== index));
  };

  if (!isTeacher && profile) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 md:px-12 flex items-center justify-center">
        <HoloCard className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Teacher Access Required</h2>
          <p className="text-slate-400 mb-6">
            Only verified teachers can submit resources to Apex Commons.
            Contact us to get verified as a teacher.
          </p>
          <Link
            href="/commons/browse"
            className="text-purple-400 hover:text-purple-300"
          >
            Browse existing resources
          </Link>
        </HoloCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Back Navigation */}
      <div className="px-6 md:px-12 mb-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/commons/browse"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 md:px-12 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Contribute a Resource
          </h1>
          <p className="text-lg text-slate-400">
            Share your educational materials with the community
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 md:px-12 mb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                      s < step ? 'bg-green-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>Basic Info</span>
            <span>Files</span>
            <span>Metadata</span>
            <span>Review</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <HoloCard>
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Basic Information</h2>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="e.g., Introduction to Fractions - Grade 4"
                        className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                          errors.title
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-400">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Describe what this resource covers, learning objectives, and how to use it..."
                        rows={4}
                        className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 resize-none ${
                          errors.description
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Subject *
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => updateField('subject', e.target.value)}
                          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-1 ${
                            errors.subject
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
                          }`}
                        >
                          <option value="">Select subject</option>
                          {COMMONS_SUBJECTS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        {errors.subject && (
                          <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Grade Level *
                        </label>
                        <select
                          value={formData.gradeLevel}
                          onChange={(e) => updateField('gradeLevel', e.target.value)}
                          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-1 ${
                            errors.gradeLevel
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
                          }`}
                        >
                          <option value="">Select grade level</option>
                          {COMMONS_GRADE_LEVELS.map((g) => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                          ))}
                        </select>
                        {errors.gradeLevel && (
                          <p className="mt-1 text-sm text-red-400">{errors.gradeLevel}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-1 ${
                          errors.category
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                      >
                        <option value="">Select category</option>
                        {COMMONS_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-400">{errors.category}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Files */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Upload Files</h2>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Resource Type *
                      </label>
                      <select
                        value={formData.resourceType}
                        onChange={(e) => updateField('resourceType', e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-1 ${
                          errors.resourceType
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                      >
                        <option value="">Select type</option>
                        {COMMONS_RESOURCE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      {errors.resourceType && (
                        <p className="mt-1 text-sm text-red-400">{errors.resourceType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Files *
                      </label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center ${
                          errors.files ? 'border-red-500' : 'border-slate-700'
                        }`}
                      >
                        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">
                          Drag and drop files here, or click to browse
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-block px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg cursor-pointer transition-all"
                        >
                          Choose Files
                        </label>
                      </div>
                      {errors.files && (
                        <p className="mt-1 text-sm text-red-400">{errors.files}</p>
                      )}

                      {formData.files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-purple-400" />
                                <div>
                                  <p className="text-sm text-white">{file.name}</p>
                                  <p className="text-xs text-slate-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-slate-400 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Metadata */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Additional Details</h2>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tags (up to 10)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add a tag..."
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={addTag}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm"
                            >
                              {tag}
                              <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Education Standards
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={standardInput}
                          onChange={(e) => setStandardInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStandard())}
                          placeholder="e.g., CCSS.MATH.4.NF.A.1"
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={addStandard}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                      {formData.standards.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.standards.map((standard) => (
                            <span
                              key={standard}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm border border-cyan-500/30"
                            >
                              {standard}
                              <button onClick={() => removeStandard(standard)} className="hover:text-red-400">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Estimated Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.duration ?? ''}
                        onChange={(e) => updateField('duration', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g., 45"
                        min="1"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Review & Submit</h2>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h3 className="font-semibold text-white mb-2">{formData.title}</h3>
                        <p className="text-sm text-slate-400">{formData.description}</p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Subject</p>
                          <p className="text-white">{COMMONS_SUBJECTS.find(s => s.value === formData.subject)?.label}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Grade Level</p>
                          <p className="text-white">{COMMONS_GRADE_LEVELS.find(g => g.value === formData.gradeLevel)?.label}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-1">Category</p>
                          <p className="text-white">{COMMONS_CATEGORIES.find(c => c.value === formData.category)?.label}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Files ({formData.files.length})</p>
                        <p className="text-white">{formData.files.map(f => f.name).join(', ')}</p>
                      </div>

                      {formData.tags.length > 0 && (
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {formData.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex gap-3">
                        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-400 mb-1">Review Process</p>
                          <p className="text-sm text-slate-400">
                            Your resource will be reviewed by our moderators before being published.
                            You'll earn 50 RC when it's approved!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                  <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  {step < 4 ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-all"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={createResourceMutation.isPending}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                      {createResourceMutation.isPending ? 'Submitting...' : 'Submit Resource'}
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </HoloCard>
            </div>

            {/* Sidebar - Quality Guidelines */}
            <div className="lg:col-span-1">
              <HoloCard>
                <h3 className="text-lg font-semibold text-white mb-4">Quality Guidelines</h3>
                <div className="space-y-4">
                  {QUALITY_GUIDELINES.map((guideline, index) => (
                    <div key={index} className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white text-sm">{guideline.title}</p>
                        <p className="text-xs text-slate-400">{guideline.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </HoloCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
