"use client"

import React, { useState } from 'react';
import { useShowPlan } from '@/lib/hooks/use-show-plan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight } from 'lucide-react';
import { InquiryForm } from '@/components/forms/inquiry-form';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function BuildShowPage() {
  const { plan, removeFromPlan, clearPlan, itemCount } = useShowPlan();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    const submissionData = {
      ...data,
      type: 'inquiry',
      showPlan: plan.map(item => item.title), // Send an array of titles
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) throw new Error('Something went wrong');

      toast({
        title: "Show Plan Submitted!",
        description: "Thank you for your interest. We will get back to you shortly.",
      });
      clearPlan();
      router.push('/'); // Redirect to home after successful submission
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Could not submit your plan. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Your Show Plan */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Show Plan ({itemCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {itemCount > 0 ? (
                <ul className="space-y-4">
                  {plan.map(item => (
                    <li key={`${item.id}-${item.type}`} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromPlan(item.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Your plan is empty. Start by adding arrangements to your plan!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inquiry Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Plan</CardTitle>
              <p className="text-muted-foreground">Complete the form below to submit your custom show plan for a consultation and quote.</p>
            </CardHeader>
            <CardContent>
              <InquiryForm
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                isGeneralInquiry={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 