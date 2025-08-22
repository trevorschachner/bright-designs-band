"use client"

import React, { useState } from 'react';
import { InquiryForm } from '@/components/forms/inquiry-form';
import { toast } from '@/components/ui/use-toast';

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, type: 'inquiry' }), // We can reuse the 'inquiry' type
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
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Contact Us
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Have a question or a project in mind? We'd love to hear from you.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <InquiryForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isGeneralInquiry={true}
          />
        </div>
      </div>
    </div>
  );
}