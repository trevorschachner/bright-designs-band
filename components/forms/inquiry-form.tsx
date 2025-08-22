"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
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
  bandSize: z.enum(["1-30", "31-60", "61-90", "91-120", "120+"], {
    required_error: "You need to select a band size.",
  }),
  abilityLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Professional"], {
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
  { id: "copyright", label: "Copyright Acquisition" },
  { id: "percussion", label: "Percussion Writing/Right-Sizing" },
  { id: "solos", label: "Solo Adjustments" },
  { id: "drill", label: "Drill/Visual Design" },
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="showInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Show of Interest</FormLabel>
              <FormControl>
                <Input {...field} readOnly={!isGeneralInquiry} className={isGeneralInquiry ? "" : "bg-muted"} placeholder={isGeneralInquiry ? "e.g., Custom Show Inquiry, General Question" : ""} />
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
                  <Input placeholder="John Doe" {...field} />
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
                  <Input placeholder="director@school.edu" {...field} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        <RadioGroupItem value="1-30" />
                      </FormControl>
                      <FormLabel className="font-normal">1-30 members</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="31-60" />
                      </FormControl>
                      <FormLabel className="font-normal">31-60 members</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="61-90" />
                      </FormControl>
                      <FormLabel className="font-normal">61-90 members</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="91-120" />
                      </FormControl>
                      <FormLabel className="font-normal">91-120 members</FormLabel>
                    </FormItem>
                     <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="120+" />
                      </FormControl>
                      <FormLabel className="font-normal">120+ members</FormLabel>
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
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Beginner" />
                      </FormControl>
                      <FormLabel className="font-normal">Beginner / Young Ensemble</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Intermediate" />
                      </FormControl>
                      <FormLabel className="font-normal">Intermediate / High School</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Advanced" />
                      </FormControl>
                      <FormLabel className="font-normal">Advanced / Competitive</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Professional" />
                      </FormControl>
                      <FormLabel className="font-normal">Professional / University</FormLabel>
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
              <div className="mb-4">
                <FormLabel className="text-base">Additional Services</FormLabel>
                <FormDescription>
                  Select any additional services you may be interested in.
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
              <FormLabel>Specific Instrumentation Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., 'We have a strong flute section but only one tuba.' or 'Need parts for 2 synths.'"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Let us know any specific strengths, weaknesses, or needs in your instrumentation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Inquiry"}
        </Button>
      </form>
    </Form>
  )
}
