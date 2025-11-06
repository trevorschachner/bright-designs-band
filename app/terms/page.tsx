import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto prose lg:prose-xl dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>1. Agreement to Terms</h2>
        <p>
          By using our website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the site. We may revise and update these Terms of Service from time to time in our sole discretion. All changes are effective immediately when we post them.
        </p>

        <h2>2. Our Services</h2>
        <p>
          Bright Designs provides custom marching band show design, music arrangement, and consultation services. Our website is a platform for you to inquire about these services. All services are subject to a separate contractual agreement.
        </p>

        <h2>3. Intellectual Property</h2>
        <p>
          The Site and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Bright Designs, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
        </p>

        <h2>4. Prohibited Uses</h2>
        <p>
          You may use the Site only for lawful purposes and in accordance with these Terms of Service. You agree not to use the Site in any way that violates any applicable federal, state, local, or international law or regulation.
        </p>

        <h2>5. Disclaimer of Warranties</h2>
        <p>
          Your use of the site, its content, and any services or items obtained through the website is at your own risk. The site, its content, and any services or items obtained through the website are provided on an &quot;as is&quot; and &quot;as available&quot; basis, without any warranties of any kind, either express or implied.
        </p>

        <h2>6. Limitation on Liability</h2>
        <p>
          To the fullest extent provided by law, in no event will Bright Designs, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind, under any legal theory, arising out of or in connection with your use, or inability to use, the website, any websites linked to it, any content on the website or such other websites, including any direct, indirect, special, incidental, consequential, or punitive damages.
        </p>

        <h2>7. Governing Law</h2>
        <p>
          All matters relating to the Site and these Terms of Service, and any dispute or claim arising therefrom or related thereto, shall be governed by and construed in accordance with the internal laws of the State of [Your State] without giving effect to any choice or conflict of law provision or rule.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions or comments about these Terms of Service, please contact us at:
        </p>
        <p>
          Bright Designs<br />
          [Your Contact Email]
        </p>
      </div>
    </div>
  );
}
