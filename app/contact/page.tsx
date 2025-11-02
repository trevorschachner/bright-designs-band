"use client"

import React, { useState } from 'react'
import { InquiryForm } from '@/components/forms/inquiry-form'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail } from 'lucide-react'

interface ContactPayload {
  type: 'inquiry' | 'contact';
  name: string;
  email: string;
  message?: string;
  [key: string]: unknown;
}

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (data: ContactPayload) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, type: 'inquiry' }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong');
      }

      toast({
        title: "Inquiry Submitted!",
        description: "Thank you for your interest. We will get back to you shortly.",
      });
      setSubmitted(true);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Could not submit your inquiry. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Have a question or a project in mind? We&apos;d love to hear from you.
          </p>
        </div>
        <div className="frame-card p-8">
          {submitted ? (
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Thanks! Your inquiry has been sent.</h2>
              <p className="text-muted-foreground mb-6">We&apos;ll get back to you shortly. If you need to reach us directly, use the email button below.</p>
              <div className="mt-8 text-left">
                <h3 className="text-lg font-semibold mb-3">What to expect next</h3>
                <ol className="list-decimal pl-5 space-y-3 text-foreground/90">
                  <li>We will follow up within 24–48 hours.</li>
                  <li>We will schedule a call and/or send a few forms to gather details like instrumentation and ability level.</li>
                  <li>We will determine the level of involvement from our team.</li>
                  <li>We will prepare contracts and invoices, if applicable.</li>
                  <li>We will deliver materials or begin the custom design process.</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <a href="mailto:info@brightdesigns.band?subject=Inquiry%20from%20Bright%20Designs%20Website&body=Hi%20Bright%20Designs%2C%0A%0AI'm%20interested%20in%20...%0A%0AThanks!">
                    <Mail className="w-4 h-4 mr-2" /> Email Us
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/">Back to Home</a>
                </Button>
              </div>
            </div>
          ) : (
            <InquiryForm
              onSubmit={handleSubmit as any}
              isLoading={isLoading}
              isGeneralInquiry={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}