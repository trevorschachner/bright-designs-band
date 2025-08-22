import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="max-w-3xl mx-auto prose lg:prose-xl dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>Introduction</h2>
        <p>
          Bright Designs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
        </p>

        <h2>Collection of Your Information</h2>
        <p>
          We may collect information about you in a variety of ways. The information we may collect on the Site includes:
        </p>
        <ul>
          <li>
            <strong>Personal Data:</strong> Personally identifiable information, such as your name, school or organization, email address, and telephone number, that you voluntarily give to us when you fill out an inquiry form.
          </li>
          <li>
            <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
          </li>
        </ul>

        <h2>Use of Your Information</h2>
        <p>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
        </p>
        <ul>
          <li>Respond to your inquiries and provide you with information about our services.</li>
          <li>Send you administrative information, such as information regarding the site and changes to our terms, conditions, and policies.</li>
          <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
          <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
        </ul>

        <h2>Disclosure of Your Information</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
        </p>

        <h2>Security of Your Information</h2>
        <p>
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>
        
        <h2>Policy for Children</h2>
        <p>
          We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions or comments about this Privacy Policy, please contact us at:
        </p>
        <p>
          Bright Designs<br />
          [Your Contact Email]<br />
          [Your Contact Phone Number]
        </p>
      </div>
    </div>
  );
}
