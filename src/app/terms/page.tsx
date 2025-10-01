import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Advertising Guidelines | Social Memes',
  description: 'Terms of service and advertising guidelines for Social Memes platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms and Advertising Guidelines</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Platform Terms of Service</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                By using Social Memes, you agree to these terms and conditions. We reserve the right to modify these terms at any time.
              </p>
              <p>
                Users are responsible for their content and must comply with all applicable laws and regulations. We do not endorse or verify the accuracy of user-generated content.
              </p>
              <p>
                We reserve the right to remove content, suspend accounts, or terminate services for violations of these terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Advertising Guidelines</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-xl font-medium text-white">2.1 Prohibited Content</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Illegal activities or content that violates laws</li>
                <li>Fraudulent, misleading, or deceptive advertising</li>
                <li>Adult content, violence, or hate speech</li>
                <li>Financial scams, pyramid schemes, or unregulated securities</li>
                <li>Content that infringes on intellectual property rights</li>
                <li>Spam, phishing, or malicious software</li>
              </ul>

              <h3 className="text-xl font-medium text-white">2.2 Token Promotion Requirements</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All token promotions must comply with applicable securities laws</li>
                <li>Promoters must disclose any material relationships or conflicts of interest</li>
                <li>False or misleading claims about token performance are prohibited</li>
                <li>Promoters are responsible for ensuring their content is accurate and compliant</li>
              </ul>

              <h3 className="text-xl font-medium text-white">2.3 Post Promotion Standards</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Promoted posts must be relevant and add value to the community</li>
                <li>Excessive or repetitive promotion of the same content is not allowed</li>
                <li>All promotional content must be clearly identifiable as such</li>
                <li>Users must not manipulate engagement metrics artificially</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. Payment and Refund Policy</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                All payments for promotions are processed through Solana blockchain transactions. Payments are non-refundable once processed.
              </p>
              <p>
                We reserve the right to reject or cancel promotions at our discretion, with full refunds provided in such cases.
              </p>
              <p>
                Promoters are responsible for ensuring they have sufficient SOL balance and proper wallet connectivity.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Content Moderation</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We employ both automated and manual content moderation to ensure platform safety and compliance.
              </p>
              <p>
                Users can report violations through our reporting system. We will investigate all reports promptly.
              </p>
              <p>
                Decisions regarding content removal or account actions are final and at our sole discretion.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Intellectual Property</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Users retain ownership of their original content but grant us a license to display and distribute it on our platform.
              </p>
              <p>
                Users must not upload content that infringes on others' intellectual property rights.
              </p>
              <p>
                We respect copyright laws and will respond to valid DMCA takedown requests.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Privacy and Data</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We collect and process data in accordance with our Privacy Policy to provide and improve our services.
              </p>
              <p>
                User data may be used for analytics, personalization, and platform optimization.
              </p>
              <p>
                We implement appropriate security measures to protect user data and transactions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Disclaimers</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Social Memes is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service or error-free operation.
              </p>
              <p>
                We are not responsible for losses incurred through platform use, including but not limited to trading losses, technical issues, or third-party actions.
              </p>
              <p>
                Cryptocurrency transactions are irreversible. Users are responsible for verifying all transaction details before confirmation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Contact Information</h2>
            <div className="space-y-4 text-gray-300">
              <p>
                For questions about these terms or to report violations, please contact us through our support channels.
              </p>
              <p>
                We will respond to all inquiries within 48 hours during business days.
              </p>
            </div>
          </section>

          <div className="border-t border-gray-700 pt-8 mt-12">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              These terms are subject to change. Continued use of the platform constitutes acceptance of any modifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
