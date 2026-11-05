"use client"

import { useRef, useState, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { ArrowRight, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/lib/hooks/use-toast"
import { Turnstile, type TurnstileHandle } from "@/components/forms/turnstile"
import { postContact } from "@/lib/page-trail"
import { FREE_SHOW_SOURCE, FREE_SHOW_TYPE } from "@/lib/free-show"

const freeShowFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.string().optional(),
  school: z.string().min(2, "Ensemble or school name is required."),
  location: z.string().min(2, "Please tell us where you're located."),
  bandSize: z.enum(["Under 20", "20-35", "36-50", "50+"], {
    required_error: "Please select your ensemble size.",
  }),
  programBenefit: z.string().min(10, "Please add a sentence or two."),
  recentChallenges: z.string().min(10, "Please add a sentence or two."),
  usedDesignGroup: z.enum(["yes", "no"], {
    required_error: "Please choose one.",
  }),
  previousDesignGroup: z.string().optional(),
  message: z.string().optional(),
})

type FreeShowFormValues = z.infer<typeof freeShowFormSchema>

const ensembleSizes = ["Under 20", "20-35", "36-50", "50+"] as const

// Radio options drawn as pills; the checked one fills with brand yellow.
const pillClass =
  "flex items-center space-y-0 rounded-full border-2 border-border pl-4 transition-colors duration-[calc(var(--count)/4)] ease-linear hover:border-brand-midnight/40 has-[[data-state=checked]]:border-brand-midnight has-[[data-state=checked]]:bg-brand-electric/25"
const pillLabelClass = "flex-1 cursor-pointer py-2.5 pl-2 pr-4 font-medium"

function FormSection({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-5 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-midnight font-heading text-xs font-bold text-brand-electric">
          {step}
        </span>
        <span className="font-heading text-lg font-bold text-brand-midnight">{title}</span>
      </legend>
      {children}
    </fieldset>
  )
}

export function FreeShowForm() {
  const form = useForm<FreeShowFormValues>({
    resolver: zodResolver(freeShowFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      school: "",
      location: "",
      programBenefit: "",
      recentChallenges: "",
      previousDesignGroup: "",
      message: "",
    },
  })

  const turnstileRef = useRef<TurnstileHandle>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const usedDesignGroup = useWatch({ control: form.control, name: "usedDesignGroup" })

  // Tokens are single-use, so the widget is reset after every attempt.
  const submit = async (values: FreeShowFormValues) => {
    setIsLoading(true)
    try {
      const response = await postContact({
        ...values,
        previousDesignGroup: values.usedDesignGroup === "yes" ? values.previousDesignGroup : "",
        type: FREE_SHOW_TYPE,
        source: FREE_SHOW_SOURCE,
        turnstileToken: turnstileToken ?? "",
      })
      if (!response.ok) throw new Error("Something went wrong")
      setSubmitted(true)
    } catch {
      toast({
        title: "Entry failed",
        description: "We couldn't submit your entry. Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      turnstileRef.current?.reset()
    }
  }

  if (submitted) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-electric">
          <Check className="h-10 w-10 text-brand-midnight" strokeWidth={3} />
        </div>
        <h3 className="font-heading text-3xl font-bold text-brand-midnight">You&apos;re entered!</h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          We sent a confirmation to your inbox. If your group is drawn, we&apos;ll email you.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-12">
        <FormSection step="01" title="About you">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="director@school.com" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Role (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Director, assistant director, caption head..." className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection step="02" title="Your ensemble">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ensemble or School</FormLabel>
                  <FormControl>
                    <Input placeholder="Anytown High School Winds" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, State" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="bandSize"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Approximate Ensemble Size</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                  >
                    {ensembleSizes.map(size => (
                      <FormItem key={size} className={pillClass}>
                        <FormControl>
                          <RadioGroupItem value={size} />
                        </FormControl>
                        <FormLabel className={pillLabelClass}>{size}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection step="03" title="Your story">
          <FormField
            control={form.control}
            name="programBenefit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How would this benefit your program?</FormLabel>
                <FormControl>
                  <Textarea className="min-h-28 resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recentChallenges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What challenges has your program faced over the past 12 months?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Budget, staffing, numbers, facilities, scheduling..."
                    className="min-h-28 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="usedDesignGroup"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Have you worked with a design group before?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-3"
                  >
                    {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map(option => (
                      <FormItem key={option.value} className={pillClass}>
                        <FormControl>
                          <RadioGroupItem value={option.value} />
                        </FormControl>
                        <FormLabel className={pillLabelClass}>{option.label}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {usedDesignGroup === "yes" && (
            <FormField
              control={form.control}
              name="previousDesignGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which one(s)? (optional)</FormLabel>
                  <FormControl>
                    <Input className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anything else we should know? (optional)</FormLabel>
                <FormControl>
                  <Textarea className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <div className="border-t border-border pt-8">
          <Turnstile ref={turnstileRef} onToken={setTurnstileToken} className="mb-4" />
          <Button
            type="submit"
            disabled={isLoading || turnstileToken === null}
            className="h-14 w-full rounded-full bg-brand-electric text-base font-bold text-brand-midnight hover:bg-brand-electric/90"
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...
              </span>
            ) : (
              <span className="inline-flex items-center">
                Enter the drawing <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
