import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Compass,
  Lock,
  ArrowRight,
  Droplets,
  Trash2,
  Construction,
  Lightbulb,
  Building2,
  Wrench,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Select } from '@/components/Select'
import { Card } from '@/components/Card'
import { SectionTitle } from '@/components/SectionTitle'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Loading } from '@/components/Loading'
import { useReports } from '@/hooks/useReports'
import { CATEGORIES } from '@/services/reports'

import { SearchableLocationSelect } from '@/components/SearchableLocationSelect'
import { getLgas, getLocations, OFFICIAL_LGAS } from '@/services/locations'
import type { LocalGovernmentArea, LocationItem } from '@/types'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  BLOCKED_DRAIN: Droplets,
  WASTE_DISPOSAL: Trash2,
  DAMAGED_ROAD: Construction,
  STREETLIGHT: Lightbulb,
  DAMAGED_FACILITY: Building2,
  OTHER: Wrench,
}

const formSchema = z
  .object({
    category: z.string().min(1, 'Please select an issue category'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    lga: z.string().min(1, 'Please select a Region / Local Government Area'),
    locationId: z.string().min(1, 'Please select a community, street or landmark'),
    location: z.string().optional(),
    customLocation: z.string().optional(),
    streetNumber: z
      .string()
      .trim()
      .min(1, 'Street number is required')
      .max(100, 'Street number must be at most 100 characters'),
    latitude: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().optional()),
    longitude: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().optional()),
    contactName: z.string().max(100).optional().or(z.literal('')),
    contactPhone: z.string().max(50).optional().or(z.literal('')),
    contactEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email('Enter a valid email address')
      .max(150, 'Email address must be at most 150 characters'),
  })
  .superRefine((data, ctx) => {
    if (data.locationId === 'OTHER') {
      if (!data.customLocation || data.customLocation.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please specify the exact community, street or landmark name',
          path: ['customLocation'],
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

export function ReportSubmitPage() {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || ''

  const { submitReport, loading, error } = useReports()
  const [submitted, setSubmitted] = useState<{
    referenceCode: string
    emailSent: boolean
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoNotice, setGeoNotice] = useState<string | null>(null)

  const [lgas, setLgas] = useState<LocalGovernmentArea[]>(OFFICIAL_LGAS)
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: categoryParam,
      title: '',
      description: '',
      lga: '',
      locationId: '',
      location: '',
      customLocation: '',
      streetNumber: '',
      latitude: undefined,
      longitude: undefined,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    },
  })

  // Load official LGAs on mount
  useEffect(() => {
    getLgas().then(setLgas).catch(() => {})
  }, [])

  // Watch selected values
  const selectedCategory = methods.watch('category')
  const selectedLga = methods.watch('lga')
  const selectedLocationId = methods.watch('locationId')

  const currentLga = lgas.find((l) => l.id === selectedLga)

  // Handle LGA change
  const handleLgaChange = async (newLgaId: string) => {
    methods.setValue('lga', newLgaId, { shouldValidate: true })
    methods.setValue('locationId', '', { shouldValidate: false })
    methods.setValue('location', '')
    methods.setValue('customLocation', '')
    setLocations([])

    if (!newLgaId) return

    setLocationsLoading(true)
    try {
      const list = await getLocations(newLgaId)
      setLocations(list)
    } catch {
      setLocations([])
    } finally {
      setLocationsLoading(false)
    }
  }

  // Handle Location selection
  const handleLocationSelect = (locId: string, item?: LocationItem) => {
    methods.setValue('locationId', locId, { shouldValidate: true })
    if (locId === 'OTHER') {
      methods.setValue('location', '')
    } else if (item) {
      methods.setValue('location', item.name)
      // Auto populate coordinates if present and not already manually filled
      const currentLat = methods.getValues('latitude')
      const currentLon = methods.getValues('longitude')
      if (
        item.latitude &&
        item.longitude &&
        (currentLat === undefined || currentLat === null) &&
        (currentLon === undefined || currentLon === null)
      ) {
        methods.setValue('latitude', item.latitude)
        methods.setValue('longitude', item.longitude)
        setGeoNotice(`Coordinates auto-detected from verified location: ${item.name}.`)
      }
    }
  }

  useEffect(() => {
    if (categoryParam) {
      methods.setValue('category', categoryParam)
    }
  }, [categoryParam, methods])

  const handleGeoDetect = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setGeoNotice(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        methods.setValue('latitude', Number(pos.coords.latitude.toFixed(6)))
        methods.setValue('longitude', Number(pos.coords.longitude.toFixed(6)))
        setLocating(false)
        setGeoNotice('GPS coordinates captured from device.')
      },
      () => {
        setLocating(false)
        setGeoNotice('Could not acquire location. Please enter coordinates manually or leave blank.')
      },
      { timeout: 8000 }
    )
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitted(null)
    try {
      const selectedLoc = locations.find((l) => l.id === values.locationId)
      const locationName =
        values.locationId === 'OTHER'
          ? (values.customLocation || '').trim()
          : selectedLoc?.name || values.location || ''

      const result = await submitReport({
        title: values.title,
        description: values.description,
        category: values.category,
        lga: values.lga,
        locationId: values.locationId,
        customLocation: values.locationId === 'OTHER' ? values.customLocation?.trim() : null,
        location: locationName,
        streetNumber: values.streetNumber.trim(),
        latitude: values.latitude,
        longitude: values.longitude,
        contactName: values.contactName || null,
        contactPhone: values.contactPhone || null,
        contactEmail: values.contactEmail,
      })
      setSubmitted({ referenceCode: result.referenceCode, emailSent: result.emailSent })
    } catch {
      // error handled by hook
    }
  }

  const copyReference = () => {
    if (!submitted) return
    navigator.clipboard.writeText(submitted.referenceCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Success view
  if (submitted) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
          <Card padding="lg" className="border-canopy-200 shadow-elevated">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-canopy-100 border border-canopy-300 flex items-center justify-center mb-5 text-canopy-700 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-canopy-700 mb-1">
                Report Successfully Recorded
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight mb-2">
                Your report has been logged
              </h1>
              <p className="text-sm text-sand-600 max-w-md mb-8 leading-relaxed">
                Thank you for contributing to your community. Your report is now in the municipal queue with a unique
                tracking code.
              </p>

              {/* Delivery outcome banner */}
              {submitted.emailSent ? (
                <div className="w-full rounded-xl bg-canopy-50 border border-canopy-200 p-4 mb-8 text-left flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-canopy-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-sand-700 leading-relaxed">
                    <strong className="text-sand-900">Confirmation email sent.</strong> A confirmation email with your
                    tracking code has been sent to your inbox. Please retain it for future reference.
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-xl bg-ochre-50 border border-ochre-200 p-4 mb-8 text-left flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-ochre-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-sand-700 leading-relaxed">
                    <strong className="text-sand-900">Confirmation email could not be sent.</strong> Your report was
                    still submitted and saved. Save your tracking code above — you will need it to track your report.
                  </div>
                </div>
              )}

              {/* Reference Code Display */}
              <div className="w-full bg-sand-50 border-2 border-dashed border-sand-300 rounded-2xl p-5 mb-8 text-left">
                <span className="block text-xs font-bold uppercase tracking-wider text-sand-500 mb-2">
                  Official Tracking Code (Save This)
                </span>
                <div className="flex items-center justify-between gap-3 bg-white border border-sand-300 rounded-xl px-4 py-3 shadow-subtle">
                  <span className="font-mono text-xl sm:text-2xl font-black text-river-900 tracking-wider">
                    {submitted.referenceCode}
                  </span>
                  <button
                    onClick={copyReference}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-river-50 hover:bg-river-100 text-river-900 border border-river-200 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-canopy-600" />
                        <span className="text-canopy-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2.5 text-xs text-sand-600">
                  Anyone with this code can check status updates and notes from municipal officers.
                </p>
              </div>

              {/* Next Steps Guide */}
              <div className="w-full text-left rounded-xl bg-river-50/70 border border-river-200/80 p-4 mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-river-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-river-600" /> What happens next?
                </h2>
                <ul className="text-xs text-river-950 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-river-600">1.</span>
                    <span>Municipal teams will review and triage the issue within your area council.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-river-600">2.</span>
                    <span>Public inspection notes will be recorded directly on this tracking code.</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="w-full grid sm:grid-cols-2 gap-3">
                <Button
                  to={`/track/${encodeURIComponent(submitted.referenceCode)}`}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Track This Report Now <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setSubmitted(null)
                    methods.reset()
                  }}
                >
                  Submit Another Report
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full">
        {/* Breadcrumb Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 hover:text-river-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-ochre-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-ochre-700">Public Filing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
            Report a Community Problem
          </h1>
          <p className="mt-1 text-sm text-sand-600">
            Tell us what is broken or hazardous in your area. Required fields are marked with an asterisk (*).
          </p>
        </div>

        {loading ? (
          <Card padding="lg">
            <Loading message="Submitting report to municipal registry…" />
          </Card>
        ) : (
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Issue Details */}
            <Card padding="lg">
              <SectionTitle
                eyebrow="Step 1"
                title="Issue Details"
                description="Categorize the problem and describe what is occurring."
              />

              {/* Interactive Category Chips */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-sand-800 mb-2">
                  Category * <span className="text-xs font-normal text-sand-500">(Click to select)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.value] || Wrench
                    const isSelected = selectedCategory === cat.value
                    return (
                      <button
                        type="button"
                        key={cat.value}
                        onClick={() => methods.setValue('category', cat.value, { shouldValidate: true })}
                        className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-river-900 border-river-900 text-white shadow-sm ring-2 ring-river-500/20'
                            : 'bg-sand-50 border-sand-200 text-sand-800 hover:bg-white hover:border-sand-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-canopy-400' : 'text-sand-500'}`} />
                        <span className="leading-tight">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
                {methods.formState.errors.category && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {methods.formState.errors.category.message}
                  </p>
                )}
              </div>

              {/* Fallback Select */}
              <Select
                label="Selected Category Dropdown"
                options={CATEGORIES}
                placeholder="Choose an issue category"
                error={methods.formState.errors.category?.message}
                {...methods.register('category')}
              />

              <Input
                label="Report Title"
                required
                placeholder="e.g. Broken drainage culvert near Albert Market"
                hint="Be specific about the problem in a single clear headline."
                error={methods.formState.errors.title?.message}
                {...methods.register('title')}
              />

              <Textarea
                label="Detailed Description"
                required
                placeholder="Describe what happened, how long the issue has persisted, whether water or traffic is blocked, and hazards to children or vehicles."
                hint="Minimum 10 characters. The more details you provide, the faster officers can triage."
                error={methods.formState.errors.description?.message}
                {...methods.register('description')}
              />
            </Card>

            {/* Step 2: Location & Geography */}
            <Card padding="lg">
              <SectionTitle
                eyebrow="Step 2"
                title="Location & Geography"
                description="Where exactly is this infrastructure problem located? Select the administrative council and specific location."
              />

              {/* Region / Local Government Area Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-sand-800 mb-1.5">
                  Region / Local Government Area <span className="text-red-500">*</span>
                </label>
                <select
                  className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white font-medium cursor-pointer transition-all ${
                    methods.formState.errors.lga
                      ? 'border-red-400 text-sand-900 focus:ring-2 focus:ring-red-400/20'
                      : 'border-sand-300 text-sand-900 focus:ring-2 focus:ring-river-500 hover:border-sand-400 shadow-sm'
                  }`}
                  value={selectedLga}
                  onChange={(e) => handleLgaChange(e.target.value)}
                >
                  <option value="">Choose a Region / Local Government Area</option>
                  {lgas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.councilType} • {l.administrativeRegion})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-sand-500">
                  Select the municipal council or local government area responsible for this jurisdiction.
                </p>
                {methods.formState.errors.lga && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {methods.formState.errors.lga.message}
                  </p>
                )}
              </div>

              {/* Community, Street or Landmark Searchable Dropdown */}
              <div className="mb-4">
                <SearchableLocationSelect
                  locations={locations}
                  value={selectedLocationId}
                  onChange={handleLocationSelect}
                  disabled={!selectedLga}
                  loading={locationsLoading}
                  error={methods.formState.errors.locationId?.message}
                  lgaName={currentLga?.name}
                  placeholder={
                    selectedLga
                      ? `Search in ${currentLga?.name}…`
                      : 'Select a Region / LGA first to view locations'
                  }
                />
              </div>

              {/* Conditional manual text input for Other / Not listed */}
              {selectedLocationId === 'OTHER' && (
                <div className="mb-4 animate-in fade-in-0 duration-150">
                  <Input
                    label="Specify Community, Street or Landmark *"
                    required
                    placeholder="e.g. Near Old Mosque, London Corner or specific compound lane"
                    hint="Describe the specific community, settlement, street, or landmark not found in the verified list."
                    error={methods.formState.errors.customLocation?.message}
                    {...methods.register('customLocation')}
                  />
                </div>
              )}

              <Input
                label="Street Number *"
                required
                placeholder="e.g. 12A or your local street/house number"
                hint="Enter the street or house number where the issue is located. Keep the area and landmark details below to help officers find the location."
                error={methods.formState.errors.streetNumber?.message}
                {...methods.register('streetNumber')}
              />

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-sand-700">GPS Coordinates (Optional)</span>
                  <button
                    type="button"
                    onClick={handleGeoDetect}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-river-700 hover:text-river-900 bg-river-50 border border-river-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Compass className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                    {locating ? 'Acquiring GPS…' : 'Use Current GPS'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Latitude"
                    placeholder="e.g. 13.4539"
                    type="number"
                    step="any"
                    error={methods.formState.errors.latitude?.message}
                    {...methods.register('latitude')}
                  />
                  <Input
                    label="Longitude"
                    placeholder="e.g. -16.5739"
                    type="number"
                    step="any"
                    error={methods.formState.errors.longitude?.message}
                    {...methods.register('longitude')}
                  />
                </div>
                {geoNotice && (
                  <p className="text-xs text-canopy-700 bg-canopy-50 border border-canopy-200 rounded-lg p-2 mt-1">
                    {geoNotice}
                  </p>
                )}
              </div>
            </Card>

            {/* Step 3: Citizen Contact */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-2">
                <SectionTitle
                  eyebrow="Step 3"
                  title="Citizen Contact"
                  description="An email address is required so we can send your confirmation and tracking code."
                  className="mb-0"
                />
              </div>

              <div className="rounded-xl bg-sand-100/70 border border-sand-200/90 p-3 mb-4 flex items-center gap-2 text-xs text-sand-700">
                <Lock className="w-4 h-4 text-river-600 flex-shrink-0" />
                <span>
                  <strong>Privacy Protected:</strong> Your name and phone are optional. Your email is used only to
                  send your confirmation and is never shown on the public tracking page.
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  label="Your Name"
                  placeholder="Optional — e.g. Ebrima Jallow"
                  error={methods.formState.errors.contactName?.message}
                  {...methods.register('contactName')}
                />
                <Input
                  label="Phone Number"
                  placeholder="Optional — e.g. +220 7xxxxxx"
                  type="tel"
                  error={methods.formState.errors.contactPhone?.message}
                  {...methods.register('contactPhone')}
                />
              </div>

              <Input
                label="Email Address"
                required
                placeholder="e.g. citizen@example.gm"
                type="email"
                hint="We will send your confirmation and tracking code to this address."
                error={methods.formState.errors.contactEmail?.message}
                {...methods.register('contactEmail')}
              />
            </Card>

            {error && <ErrorMessage message={error} />}

            {/* Submission Action */}
            <div className="pt-2">
              <Button type="submit" variant="ochre" size="lg" className="w-full text-base py-4" disabled={loading}>
                {loading ? 'Submitting to Municipal Registry…' : 'Submit Community Report'}
              </Button>
              <p className="text-xs text-sand-500 text-center mt-3">
                By submitting, you confirm this is a genuine community issue in The Gambia.
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
