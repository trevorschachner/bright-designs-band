"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InquiryForm } from "@/components/forms/inquiry-form"
import { toast } from "@/components/ui/use-toast"

interface CheckAvailabilityModalProps {
  showTitle: string
  triggerButton?: React.ReactNode
}

interface InquiryPayload {
  name: string;
  email: string;
  school: string;
  showInterest: string;
  bandSize: string;
  abilityLevel: string;
  instrumentation?: string;
  services: string[];
  message?: string;
}

export function CheckAvailabilityModal({ showTitle, triggerButton }: CheckAvailabilityModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: InquiryPayload) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, type: 'inquiry' }),
      })

      if (!response.ok) {
        throw new Error('Something went wrong')
      }

      toast({
        title: "Inquiry Submitted!",
        description: "Thank you for your interest. We will get back to you shortly.",
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Could not submit your inquiry. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || <Button size="lg" className="btn-wireframe-primary px-8 h-12 text-xs uppercase tracking-wide">Check Availability</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] wireframe-border bg-background">
        <DialogHeader className="wireframe-border-dashed border-b pb-6">
          <DialogTitle className="wireframe-heading text-xl">Check Availability</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete the form below to inquire about this show. Our team will get back to you shortly to discuss your ensemble&apos;s needs.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <InquiryForm 
            showTitle={showTitle}
            onSubmit={handleSubmit as any}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
