"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

const inquiryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  school: z.string().min(2, "School name is required."),
  showInterest: z.string(),
  bandSize: z.enum(["1-50", "51-100", "101-150", "150+"], {
    required_error: "You need to select a band size.",
  }),
  abilityLevel: z.enum(["1-2", "3-4", "5-6+"], {
    required_error: "You need to select an ability level.",
  }),
  instrumentation: z.string().optional(),
  services: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one service.",
  }),
  message: z.string().optional(),
})

type InquiryFormValues = z.infer<typeof inquiryFormSchema>

interface InquiryFormProps {
  showTitle?: string
  onSubmit: (data: InquiryFormValues) => void
  isLoading: boolean
  isGeneralInquiry?: boolean
}

const serviceItems = [
  { id: "wind-arranging", label: "Custom Wind Arranging" },
  { id: "program-coordination", label: "Full Program Coordination" },
  { id: "drill", label: "Drill and Visual Design" },
  { id: "choreography", label: "Choreography" },
  { id: "copyright", label: "Copyright Acquisition" },
  { id: "percussion", label: "Percussion Writing/Right-Sizing" },
  { id: "solos", label: "Solo Adjustments" },
  { id: "other", label: "Other (please specify in message)" },
]

export function InquiryForm({ showTitle, onSubmit, isLoading, isGeneralInquiry }: InquiryFormProps) {
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: "",
      email: "",
      school: "",
      showInterest: showTitle || "",
      services: [],
      instrumentation: "",
      message: "",
    },
  })

  const showInterestLabel = isGeneralInquiry ? "Inquiry Topic or Project" : "Show of Interest"
  const showInterestPlaceholder = isGeneralInquiry ? "e.g., Custom Show Inquiry, General Question" : ""

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="showInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{showInterestLabel}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  readOnly={!isGeneralInquiry}
                  className={isGeneralInquiry ? "" : "bg-muted"}
                  placeholder={showInterestPlaceholder}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
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
                  <Input placeholder="director@school.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School or Organization</FormLabel>
              <FormControl>
                <Input placeholder="Anytown High School" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 wireframe-border-dashed border-t">
          <FormField
            control={form.control}
            name="bandSize"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Approximate Band Size</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="1-50" />
                      </FormControl>
                      <FormLabel className="font-normal">1-50 members</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="51-100" />
                      </FormControl>
                      <FormLabel className="font-normal">51-100 members</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="101-150" />
                      </FormControl>
                      <FormLabel className="font-normal">101-150 members</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="150+" />
                      </FormControl>
                      <FormLabel className="font-normal">150+ members</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="abilityLevel"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Ensemble Ability Level</FormLabel>
                <FormDescription className="text-[0.8rem] text-muted-foreground">
                  This helps us understand how to best serve your program.
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="1-2" />
                      </FormControl>
                      <FormLabel className="font-normal">Grades 1-2</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="3-4" />
                      </FormControl>
                      <FormLabel className="font-normal">Grades 3-4</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="5-6+" />
                      </FormControl>
                      <FormLabel className="font-normal">Grades 5-6+</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="services"
          render={() => (
            <FormItem>
              <div className="mb-6 pt-6 wireframe-border-dashed border-t">
                <FormLabel className="text-lg wireframe-heading">Services</FormLabel>
                <FormDescription className="mt-2 text-muted-foreground">
                  Select the services you may be interested in.
                </FormDescription>
              </div>
              {serviceItems.map(item => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="services"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={checked => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      value => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instrumentation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes or Questions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share instrumentation context, logistics, timelines, or anything else we should know."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-10 mt-2 wireframe-border-dashed border-t">
          <Button type="submit" disabled={isLoading} className="btn-wireframe-primary w-full h-12 text-sm uppercase tracking-wide">
            {isLoading ? (
              <span className="inline-flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
              </span>
            ) : (
              "Submit Inquiry"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
