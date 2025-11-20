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
import { Calendar, ArrowRight, Sparkles } from "lucide-react"

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

  const defaultTrigger = (
    <Button className="group relative w-full text-base py-7 h-auto font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-2xl transition-all duration-300 rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      <div className="relative flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <Sparkles className="w-4 h-4 opacity-80" />
        </div>
        <span>Check Availability</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </Button>
  )

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
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-6">
          <DialogTitle className="text-xl">Check Availability</DialogTitle>
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
