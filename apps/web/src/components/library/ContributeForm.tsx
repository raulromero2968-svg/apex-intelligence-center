'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Upload,
  X,
  BookOpen,
  FileText,
  Video,
  Presentation,
  FileQuestion,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Title and description' },
  { id: 2, title: 'Classification', description: 'Category and type' },
  { id: 3, title: 'Details', description: 'Tags and standards' },
  { id: 4, title: 'Files', description: 'Upload resources' },
  { id: 5, title: 'Review', description: 'Submit for review' },
];

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language',
];

const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  'Elementary (1-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'Higher Education',
  'Adult Learning',
];

const RESOURCE_TYPES = [
  { value: 'lesson_plan', label: 'Lesson Plan', icon: BookOpen },
  { value: 'worksheet', label: 'Worksheet', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'presentation', label: 'Presentation', icon: Presentation },
  { value: 'assessment', label: 'Assessment', icon: FileText },
  { value: 'template', label: 'Template', icon: FileText },
  { value: 'other', label: 'Other', icon: FileQuestion },
];

const CATEGORIES = [
  'STEM',
  'Humanities',
  'Arts',
  'Languages',
  'Social Studies',
  'Health & PE',
  'Special Education',
  'Professional Development',
  'Classroom Management',
  'Other',
];

type ResourceType = 'lesson_plan' | 'worksheet' | 'video' | 'article' | 'presentation' | 'assessment' | 'template' | 'other';

interface FormData {
  title: string;
  description: string;
  category: string;
  subject: string;
  gradeLevel: string;
  resourceType: ResourceType;
  tags: string[];
  standards: { framework: string; codes: string[] }[];
  estimatedDuration: number | undefined;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | undefined;
  files: { url: string; name: string; type: string; size: number }[];
  thumbnailUrl: string;
}

export function ContributeForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    subject: '',
    gradeLevel: '',
    resourceType: 'lesson_plan',
    tags: [],
    standards: [],
    estimatedDuration: undefined,
    difficulty: undefined,
    files: [],
    thumbnailUrl: '',
  });

  const createResource = api.apexCommons.createResource.useMutation({
    onSuccess: (data) => {
      router.push(`/library/resource/${data.id}?created=true`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.length >= 3 && formData.description.length >= 10;
      case 2:
        return formData.category && formData.resourceType;
      case 3:
        return true; // Tags and standards are optional
      case 4:
        return true; // Files are optional initially
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await createResource.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subject: formData.subject || undefined,
        gradeLevel: formData.gradeLevel || undefined,
        resourceType: formData.resourceType,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        standards: formData.standards.length > 0 ? formData.standards : undefined,
        estimatedDuration: formData.estimatedDuration,
        difficulty: formData.difficulty,
        files: formData.files.length > 0 ? formData.files : undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
      });
    } catch (err) {
      // Error handled in onError
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <p className="mt-2 text-xs text-center hidden sm:block">
                  <span className={currentStep === step.id ? 'text-cyan-400 font-medium' : 'text-slate-500'}>
                    {step.title}
                  </span>
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30 mb-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Give your resource a descriptive title"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
              <p className="mt-1 text-xs text-slate-500">
                {formData.title.length}/200 characters (minimum 3)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe what this resource covers, how to use it, and what students will learn"
                rows={6}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 resize-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                {formData.description.length}/5000 characters (minimum 10)
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Classification */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Classification</h2>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Resource Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {RESOURCE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => updateField('resourceType', type.value as ResourceType)}
                      className={`p-4 rounded-lg border text-center transition-colors ${
                        formData.resourceType === type.value
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-800">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((subj) => (
                    <option key={subj} value={subj} className="bg-slate-800">
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => updateField('gradeLevel', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="">Select grade level</option>
                  {GRADE_LEVELS.map((level) => (
                    <option key={level} value={level} className="bg-slate-800">
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty || ''}
                  onChange={(e) => updateField('difficulty', e.target.value as FormData['difficulty'])}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner" className="bg-slate-800">Beginner</option>
                  <option value="intermediate" className="bg-slate-800">Intermediate</option>
                  <option value="advanced" className="bg-slate-800">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Additional Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.estimatedDuration || ''}
                onChange={(e) => updateField('estimatedDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 45"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>
        )}

        {/* Step 4: Files */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Upload Files</h2>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-slate-500">
                Supports PDF, DOCX, PPTX, MP4, and more (max 50MB per file)
              </p>
              <p className="mt-4 text-xs text-yellow-500">
                Note: File upload integration requires storage configuration.
                Files can be added after creation.
              </p>
            </div>
            {formData.files.length > 0 && (
              <div className="space-y-2">
                {formData.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <span className="text-white">{file.name}</span>
                    <button
                      onClick={() => updateField('files', formData.files.filter((_, i) => i !== index))}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Review & Submit</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Title</h3>
                <p className="text-white">{formData.title}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Description</h3>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{formData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-400 mb-1">Type</h3>
                  <p className="text-white">{formData.resourceType.replace('_', ' ')}</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-400 mb-1">Category</h3>
                  <p className="text-white">{formData.category}</p>
                </div>
              </div>
              {(formData.subject || formData.gradeLevel) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.subject && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-400 mb-1">Subject</h3>
                      <p className="text-white">{formData.subject}</p>
                    </div>
                  )}
                  {formData.gradeLevel && (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-400 mb-1">Grade Level</h3>
                      <p className="text-white">{formData.gradeLevel}</p>
                    </div>
                  )}
                </div>
              )}
              {formData.tags.length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-700 rounded text-sm text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Your resource will be submitted for review. Once approved by a moderator,
                it will be visible in the library and you will earn 20 RC.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-700 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createResource.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
          >
            {createResource.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Resource
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
