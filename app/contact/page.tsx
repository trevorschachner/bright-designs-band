"use client"

import React, { useState } from 'react'
import { InquiryForm } from '@/components/forms/inquiry-form'
import { toast } from '@/components/ui/use-toast'

interface ContactPayload {
  type: 'inquiry' | 'contact';
  name: string;
  email: string;
  message?: string;
  [key: string]: unknown;
}

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

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
          <InquiryForm
            onSubmit={handleSubmit as any}
            isLoading={isLoading}
            isGeneralInquiry={true}
          />
        </div>
      </div>
    </div>
  );
}