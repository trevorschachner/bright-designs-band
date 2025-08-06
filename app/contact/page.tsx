'use client';

import { useState } from "react";
import { ArrowLeft, Music, MessageCircle, Phone, Mail, MapPin, CheckCircle, AlertCircle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatPhoneNumber, validatePhoneNumber, isValidPhoneFormat } from "@/lib/utils/phone-validation"
import { ServiceCategory } from "@/lib/email/types"

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  services: ServiceCategory[];
  message: string;
  privacyAgreed: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  services?: string;
  message?: string;
  privacyAgreed?: string;
}

// Enhanced service categories with descriptions
const serviceCategories = {
  'Shows & Music': [
    {
      id: 'existing-show-purchase' as ServiceCategory,
      label: 'Purchase Existing Show',
      description: 'Buy complete show packages from our catalog'
    },
    {
      id: 'custom-show-creation' as ServiceCategory,
      label: 'Custom Show Creation',
      description: 'Full show development from concept to performance'
    },
    {
      id: 'music-arranging' as ServiceCategory,
      label: 'Music Arranging',
      description: 'Custom arrangements for marching band and color guard'
    },
    {
      id: 'music-licensing' as ServiceCategory,
      label: 'Music Licensing',
      description: 'Licensing assistance for copyrighted music'
    }
  ],
  'Design & Visual': [
    {
      id: 'drill-design' as ServiceCategory,
      label: 'Drill Design',
      description: 'Precision drill writing and formations'
    },
    {
      id: 'choreography' as ServiceCategory,
      label: 'Choreography',
      description: 'Movement design for color guard and dance elements'
    },
    {
      id: 'visual-design' as ServiceCategory,
      label: 'Visual Design',
      description: 'Overall visual concept and staging design'
    },
    {
      id: 'costume-consultation' as ServiceCategory,
      label: 'Costume Consultation',
      description: 'Uniform and costume design guidance'
    }
  ],
  'Production & Support': [
    {
      id: 'show-consultation' as ServiceCategory,
      label: 'Show Consultation',
      description: 'Strategic planning and show development advice'
    },
    {
      id: 'rehearsal-support' as ServiceCategory,
      label: 'Rehearsal Support',
      description: 'On-site teaching and rehearsal assistance'
    },
    {
      id: 'audio-production' as ServiceCategory,
      label: 'Audio Production',
      description: 'Recording, mixing, and audio editing services'
    },
    {
      id: 'video-production' as ServiceCategory,
      label: 'Video Production',
      description: 'Performance recording and promotional videos'
    }
  ],
  'Other': [
    {
      id: 'collaboration' as ServiceCategory,
      label: 'Collaboration',
      description: 'Partnership opportunities and joint projects'
    },
    {
      id: 'other' as ServiceCategory,
      label: 'Other',
      description: 'Something else? Tell us about it!'
    }
  ]
};

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    services: [],
    message: '',
    privacyAgreed: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  const handleServiceToggle = (serviceId: ServiceCategory) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
    
    // Clear service errors
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.services.length === 0) {
      newErrors.services = 'Please select at least one service';
    }
    
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!formData.privacyAgreed) newErrors.privacyAgreed = 'You must agree to the privacy policy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage(result.message || 'Thank you! Your message has been received.');
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          services: [],
          message: '',
          privacyAgreed: false,
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button className="gap-2 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Music className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Let's Create Something Amazing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to elevate your marching band program? Tell us about your vision and let's bring it to life together.
            </p>
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl">Contact Form</CardTitle>
                  <CardDescription className="text-blue-100">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  {submitStatus === 'success' && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {submitMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {submitStatus === 'error' && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {submitMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                          First Name *
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
                          placeholder="Enter your first name"
                          required
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                          Last Name *
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
                          placeholder="Enter your last name"
                          required
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                          placeholder="your@email.com"
                          required
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                          placeholder="(555) 123-4567"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                        {formData.phone && !isValidPhoneFormat(formData.phone) && formData.phone.length > 5 && (
                          <p className="text-yellow-600 text-sm mt-1">Format: (XXX) XXX-XXXX</p>
                        )}
                      </div>
                    </div>

                    {/* Services Selection */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-4 block">
                        What services are you interested in? *
                      </Label>
                      {errors.services && (
                        <p className="text-red-500 text-sm mb-3">{errors.services}</p>
                      )}
                      
                      <div className="space-y-6">
                        {Object.entries(serviceCategories).map(([category, services]) => (
                          <div key={category} className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {services.map((service) => (
                                <div key={service.id} className="flex items-start space-x-3 p-3 bg-white rounded border hover:bg-blue-50 transition-colors">
                                  <Checkbox
                                    id={service.id}
                                    checked={formData.services.includes(service.id)}
                                    onCheckedChange={() => handleServiceToggle(service.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <Label 
                                      htmlFor={service.id} 
                                      className="text-sm font-medium text-gray-900 cursor-pointer"
                                    >
                                      {service.label}
                                    </Label>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Selected Services Display */}
                      {formData.services.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Services:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.services.map((serviceId) => {
                              const service = Object.values(serviceCategories)
                                .flat()
                                .find(s => s.id === serviceId);
                              return (
                                <Badge key={serviceId} className="bg-blue-100 text-blue-800 border-transparent">
                                  {service?.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                        Tell us about your project *
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        className={`mt-1 min-h-[120px] ${errors.message ? 'border-red-500' : ''}`}
                        placeholder="Share details about your vision, timeline, budget, or any specific requirements..."
                        required
                      />
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                      )}
                    </div>

                    {/* Privacy Agreement */}
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacyAgreed"
                        checked={formData.privacyAgreed}
                        onCheckedChange={(checked: boolean | 'indeterminate') => handleInputChange('privacyAgreed', !!checked)}
                        className={`mt-0.5 ${errors.privacyAgreed ? 'border-red-500' : ''}`}
                        required
                      />
                      <Label htmlFor="privacyAgreed" className="text-sm text-gray-700 cursor-pointer">
                        I agree to the <Link href="/privacy" className="text-blue-600 hover:underline">privacy policy</Link> and 
                        consent to being contacted about this inquiry. *
                      </Label>
                    </div>
                    {errors.privacyAgreed && (
                      <p className="text-red-500 text-sm">{errors.privacyAgreed}</p>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gray-900 text-white rounded-t-lg">
                  <CardTitle className="text-xl">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">hello@brightdesigns.band</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">(555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Response Time</p>
                      <p className="text-gray-600">Within 24 hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Why Choose Us?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Professional expertise since 2015
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Custom solutions for every budget
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Nationwide client base
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Comprehensive support
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}