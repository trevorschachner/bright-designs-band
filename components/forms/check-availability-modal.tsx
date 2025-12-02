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
import { Calendar, ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import confetti from "canvas-confetti"

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
  const [submitted, setSubmitted] = useState(false)

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
        body: JSON.stringify({ ...data, type: 'inquiry', source: 'check-availability' }),
      })

      if (!response.ok) {
        throw new Error('Something went wrong')
      }

      const end = Date.now() + 1500
      const colors = ['#2563eb', '#ffffff']
      ;(function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      })()

      toast({
        title: "Inquiry Submitted!",
        description: "Thank you for your interest. We will get back to you shortly.",
      })
      setSubmitted(true)
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSubmitted(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
          {submitted ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-heading font-semibold mb-2">We received your request!</h3>
                <p className="text-muted-foreground">
                  We&apos;ll follow up within 24 hours to talk through next steps for {showTitle}.
                </p>
              </div>
              <div className="text-left bg-muted/40 border border-muted rounded-xl p-4 space-y-3">
                <h4 className="font-heading font-semibold">What happens next?</h4>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>We confirm availability and timelines for your program.</li>
                  <li>We review show needs like instrumentation, difficulty, and services.</li>
                  <li>You receive next steps on scheduling, pricing, and deliverables.</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => handleOpenChange(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <InquiryForm
              showTitle={showTitle}
              onSubmit={handleSubmit as any}
              isLoading={isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
