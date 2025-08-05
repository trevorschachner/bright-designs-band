
import { ArrowLeft, Music, MessageCircle, Phone, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-4" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 text-bright-dark font-primary">Get in touch</h1>
              <p className="text-xl text-gray-600 mb-2">We'd love to work with you.</p>
              <p className="text-lg text-gray-600">
                Please fill out this form and we will be in touch within 24 hours.
              </p>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <form className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                        First name
                      </Label>
                      <Input id="firstName" placeholder="First name" className="w-full" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Last name
                      </Label>
                      <Input id="lastName" placeholder="Last name" className="w-full" />
                    </div>
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        Email
                      </Label>
                      <Input id="email" type="email" placeholder="your@company.com" className="w-full" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone number
                      </Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="w-full" />
                    </div>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-4 block">How can we help?</Label>
                    <RadioGroup defaultValue="" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing-show" id="existing-show" />
                        <Label htmlFor="existing-show" className="text-sm">
                          Purchase Existing Show
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="choreography" id="choreography" />
                        <Label htmlFor="choreography" className="text-sm">
                          Choreography
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom-arranging" id="custom-arranging" />
                        <Label htmlFor="custom-arranging" className="text-sm">
                          Custom Music Arranging
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="show-promotion" id="show-promotion" />
                        <Label htmlFor="show-promotion" className="text-sm">
                          Show Promotion
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="drill-design" id="drill-design" />
                        <Label htmlFor="drill-design" className="text-sm">
                          Drill Design
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="text-sm">
                          Other
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                      How can we help?
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message..."
                      className="w-full min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Privacy Policy */}
                  <div className="flex items-start space-x-2">
                    <Checkbox id="privacy" className="mt-1" />
                    <Label htmlFor="privacy" className="text-sm text-gray-600 leading-relaxed">
                      You agree to our friendly{" "}
                      <Link href="#" className="text-bright-third hover:underline">
                        privacy policy
                      </Link>
                      .
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="btn-primary w-full py-3">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-primary">Contact Information</CardTitle>
                <CardDescription>Get in touch with our team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-bright-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-bright-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">hello@brightdesigns.band</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-bright-third/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-bright-third" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">(555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-bright-secondary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-bright-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">Austin, TX</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-primary">Office Hours</CardTitle>
                <CardDescription>When you can reach us</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="text-gray-600">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="text-gray-600">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="text-gray-600">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-bright-primary/5 border-0">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="w-6 h-6 text-bright-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Quick Response</h3>
                    <p className="text-sm text-gray-600">
                      We typically respond to all inquiries within 24 hours during business days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
