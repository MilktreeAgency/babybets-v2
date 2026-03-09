import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default function WebsiteTerms() {
  return (
    <div className="antialiased relative min-h-screen" style={{ color: '#2D251E', backgroundColor: '#fffbf7' }}>
      <Header />

      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="rounded-2xl p-8 md:p-16"
            style={{
              backgroundColor: 'white',
              borderWidth: '1px',
              borderColor: '#e7e5e4',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
              Website Terms of Use
            </h1>
            <p className="text-sm mb-12" style={{ color: '#78716c' }}>
              Last Updated: February 2026
            </p>

            <div className="prose prose-stone max-w-none" style={{ color: '#78716c' }}>
              <div className="space-y-6">
                <section>
                  <p className="font-bold mb-4" style={{ color: '#151e20' }}>
                    PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THIS SITE
                  </p>
                  <p className="leading-relaxed mb-4">
                    These terms tell you the rules for using our website <a href="https://www.babybets.co.uk" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>www.babybets.co.uk</a> (our site).
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Who we are and how to contact us
                  </h2>
                  <p className="leading-relaxed mb-4">
                    Our site is a site operated by Babybets Ltd ("We"). We are registered in England and Wales under company number 16963672 and have our registered office at Unit B2, Beacon House, Cumberland Business Centre, Portsmouth PO5 1DS. Our main trading address is Unit B2, Beacon House, Cumberland Business Centre, Portsmouth PO5 1DS.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We are a limited company. To contact us, please email <a href="mailto:hello@babybets.co.uk" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>hello@babybets.co.uk</a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    By using our site you accept these terms
                  </h2>
                  <p className="leading-relaxed mb-4">
                    By using our site, you confirm that you accept these terms of use and that you agree to comply with them.
                  </p>
                  <p className="leading-relaxed mb-4">
                    If you do not agree to these terms, you must not use our site.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We recommend that you print a copy of these terms for future reference.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    There are other terms that may apply to you
                  </h2>
                  <p className="leading-relaxed mb-4">
                    These terms of use refer to the following additional terms, which also apply to your use of our site:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>
                      Our Privacy Policy <a href="/legal/privacy" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>www.babybets.co.uk/legal/privacy</a> which sets out the terms on which we process any personal data we collect from you, or that you provide to us. By using our site, you consent to such processing and you warrant that all data provided by you is accurate.
                    </li>
                    <li>
                      Our Acceptable Use Policy www.babybets.co.uk/acceptable-use-policy which sets out the permitted uses and prohibited uses of our site. When using our site, you must comply with this Acceptable Use Policy.
                    </li>
                    <li>
                      If you purchase goods or services from our site, participate in any promotions or enter any of our competitions, other terms and conditions will apply and which you must accept and abide by <a href="/legal/terms" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>www.babybets.co.uk/legal/terms</a>
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    We may make changes to these terms
                  </h2>
                  <p className="leading-relaxed mb-4">
                    We may amend these terms from time to time. Every time you wish to use our site, please check these terms to ensure you understand the terms that apply at that time.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    We may make changes to our site
                  </h2>
                  <p className="leading-relaxed mb-4">
                    We may update and change our site from time to time to reflect changes to our products, services, our users' needs and our business priorities.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    We may suspend or withdraw our site
                  </h2>
                  <p className="leading-relaxed mb-4">
                    Our site is made available free of charge but you may have to pay to enter our competitions.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We do not guarantee that our site, or any content on it, will always be available or be uninterrupted. We may suspend or withdraw or restrict the availability of all or any part of our site for business and operational reasons. We will try to give you reasonable notice of any suspension or withdrawal.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You are also responsible for ensuring that all persons who access our site through your internet connection are aware of these terms of use and other applicable terms and conditions, and that they comply with them.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Who can use our site?
                  </h2>
                  <p className="font-bold mb-2" style={{ color: '#151e20' }}>
                    Our site is only for users in the United Kingdom
                  </p>
                  <p className="leading-relaxed mb-4">
                    Our site is directed to people residing in the United Kingdom. We do not represent that the content available on or through our site is appropriate for use or available in other locations.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    You must keep your account details safe
                  </h2>
                  <p className="leading-relaxed mb-4">
                    If you choose, or you are provided with, a user identification code, password or any other piece of information as part of our security procedures, you must treat such information as confidential. You must not disclose it to any third party.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We have the right to disable any user identification code or password, whether chosen by you or allocated by us, at any time, if in our reasonable opinion you have failed to comply with any of the provisions of these terms of use.
                  </p>
                  <p className="leading-relaxed mb-4">
                    If you know or suspect that anyone other than you knows your user identification code or password, you must promptly notify us at <a href="mailto:hello@babybets.co.uk" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>hello@babybets.co.uk</a>.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    How you may use material on our site
                  </h2>
                  <p className="leading-relaxed mb-4">
                    We are the owner or the licensee of all intellectual property rights in our site, and in the material published on it. Those works are protected by copyright laws and treaties around the world. All such rights are reserved.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You may print off one copy, and may download extracts, of any page(s) from our site for your personal use and you may draw the attention of others within your organisation to content posted on our site.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You must not modify the paper or digital copies of any materials you have printed off or downloaded in any way, and you must not use any illustrations, photographs, video or audio sequences or any graphics separately from any accompanying text.
                  </p>
                  <p className="leading-relaxed mb-4">
                    Our status (and that of any identified contributors) as the authors of content on our site must always be acknowledged.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You must not use any part of the content on our site for commercial purposes without obtaining a licence to do so from us or our licensors.
                  </p>
                  <p className="leading-relaxed mb-4">
                    If you print off, copy or download any part of our site in breach of these terms of use, your right to use our site will cease immediately and you must, at our option, return or destroy any copies of the materials you have made.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Do not rely on information on this site
                  </h2>
                  <p className="leading-relaxed mb-4">
                    The content on our site is provided for general information only. It is not intended to amount to advice on which you should rely. You must obtain professional or specialist advice before taking, or refraining from, any action on the basis of the content on our site.
                  </p>
                  <p className="leading-relaxed mb-4">
                    Although we make reasonable efforts to update the information on our site, we make no representations, warranties or guarantees, whether express or implied, that the content on our site is accurate, complete or up to date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    We are not responsible for websites we link to
                  </h2>
                  <p className="leading-relaxed mb-4">
                    Where our site contains links to other sites and resources provided by third parties, these links are provided for your information only. Such links should not be interpreted as approval by us of those linked websites or information you may obtain from them.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We have no control over the contents of those sites or resources.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    User-generated content is not approved by us
                  </h2>
                  <p className="leading-relaxed mb-4">
                    This website may include information and materials uploaded by other users of the site, including posts made to our social media accounts. This information and these materials have not been verified or approved by us. The views expressed by other users on our site do not represent our views or values.
                  </p>
                  <p className="leading-relaxed mb-4">
                    If you wish to complain about information and materials uploaded by other users please contact us at <a href="mailto:hello@babybets.co.uk" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>hello@babybets.co.uk</a>.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Information about our use of cookies
                  </h2>
                  <p className="leading-relaxed mb-4">
                    Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
                  </p>
                  <p className="leading-relaxed mb-4">
                    By continuing to browse the site, you are agreeing to our use of cookies.
                  </p>
                  <p className="leading-relaxed mb-4">
                    A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain information that is transferred to your computer's hard drive.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We use the following cookies:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>
                      <strong>Strictly necessary cookies.</strong> These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart or make use of e-billing services.
                    </li>
                    <li>
                      <strong>Analytical/performance cookies.</strong> They allow us to recognise and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.
                    </li>
                    <li>
                      <strong>Functionality cookies.</strong> These are used to recognise you when you return to our website. This enables us to personalise our content for you, greet you by name and remember your preferences (for example, your choice of language or region).
                    </li>
                    <li>
                      <strong>Targeting cookies.</strong> These cookies record your visit to our website, the pages you have visited and the links you have followed. We will use this information to make our website and the advertising displayed on it more relevant to your interests. We may also share this information with third parties for this purpose.
                    </li>
                  </ul>
                  <p className="leading-relaxed mb-4">
                    Please note that third parties (including, for example, advertising networks and providers of external services like web traffic analysis services) may also use cookies, over which we have no control. These cookies are likely to be analytical/performance cookies or targeting cookies.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You can block cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. However, if you use your browser settings to block all cookies (including essential cookies) you may not be able to access all or parts of our site.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Our responsibility for loss or damage suffered by you
                  </h2>
                  <p className="leading-relaxed mb-4">
                    We do not exclude or limit in any way our liability to you where it would be unlawful to do so. This includes liability for death or personal injury caused by our negligence or the negligence of our employees, agents or subcontractors and for fraud or fraudulent misrepresentation.
                  </p>
                  <p className="leading-relaxed mb-4">
                    Different limitations and exclusions of liability will apply to liability arising as a result of the supply of any products or services to you or if you enter our competitions, which will be set out in our <a href="/legal/terms" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>Terms and Conditions</a>.
                  </p>
                  <p className="leading-relaxed mb-4">
                    Please note that we only provide our site for domestic and private use. You agree not to use our site for any commercial or business purposes, and we have no liability to you for any loss of profit, loss of business, business interruption, or loss of business opportunity.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Uploading content to our site
                  </h2>
                  <p className="leading-relaxed mb-4">
                    Whenever you make use of a feature that allows you to upload content to our site, post to our social media accounts or to make contact with other users of our site, you must comply with the content standards set out in our Acceptable Use Policy www.babybets.co.uk/acceptable-use-policy
                  </p>
                  <p className="leading-relaxed mb-4">
                    You warrant that any such contribution does comply with those standards, and you will be liable to us and indemnify us for any breach of that warranty. This means you will be responsible for any loss or damage we suffer as a result of your breach of warranty.
                  </p>
                  <p className="leading-relaxed mb-4">
                    Any content you upload to our site will be considered non-confidential and non-proprietary. You retain all of your ownership rights in your content, but you are required to grant us a limited licence to use, store and copy that content and to distribute and make it available to third parties. The rights you license to us are described below.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We also have the right to disclose your identity to any third party who is claiming that any content posted or uploaded by you to our site constitutes a violation of their intellectual property rights, or of their right to privacy.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We have the right to remove any posting you make on our site if, in our opinion, your post does not comply with the content standards set out in our Acceptable Use Policy www.babybets.co.uk/acceptable-use-policy
                  </p>
                  <p className="leading-relaxed mb-4">
                    You are solely responsible for securing and backing up your content.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Rights you are giving us to use material you upload
                  </h2>
                  <p className="leading-relaxed mb-4">
                    When you upload or post content to our site, you grant us a perpetual, worldwide, non-exclusive, royalty-free, transferable licence to use, reproduce, distribute, prepare derivative works of, display, and perform that user-generated content. We may also share it, quote from it and use it to promote our site, products and services, particularly via social media.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    We are not responsible for viruses and you must not introduce them
                  </h2>
                  <p className="leading-relaxed mb-4">
                    We do not guarantee that our site will be secure or free from bugs or viruses.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You are responsible for configuring your information technology, computer programmes and platform to access our site. You should use your own virus protection software.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You must not misuse our site by knowingly introducing viruses, trojans, worms, logic bombs or other material that is malicious or technologically harmful. You must not attempt to gain unauthorised access to our site, the server on which our site is stored or any server, computer or database connected to our site. You must not attack our site via a denial-of-service attack or a distributed denial-of service attack. By breaching this provision, you would commit a criminal offence under the Computer Misuse Act 1990. We will report any such breach to the relevant law enforcement authorities and we will co-operate with those authorities by disclosing your identity to them. In the event of such a breach, your right to use our site will cease immediately.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Rules about linking to our site
                  </h2>
                  <p className="leading-relaxed mb-4">
                    You may link to our home page, provided you do so in a way that is fair and legal and does not damage our reputation or take advantage of it.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You must not establish a link in such a way as to suggest any form of association, approval or endorsement on our part where none exists.
                  </p>
                  <p className="leading-relaxed mb-4">
                    You must not establish a link to our site in any website that is not owned by you.
                  </p>
                  <p className="leading-relaxed mb-4">
                    Our site must not be framed on any other site, nor may you create a link to any part of our site other than the home page.
                  </p>
                  <p className="leading-relaxed mb-4">
                    We reserve the right to withdraw linking permission without notice.
                  </p>
                  <p className="leading-relaxed mb-4">
                    The website in which you are linking must comply in all respects with the content standards set out in our Acceptable Use Policy www.babybets.co.uk/acceptable-use-policy
                  </p>
                  <p className="leading-relaxed mb-4">
                    If you wish to link to or make any use of content on our site other than that set out above, please contact <a href="mailto:hello@babybets.co.uk" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>hello@babybets.co.uk</a>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Which country's laws apply to any disputes?
                  </h2>
                  <p className="leading-relaxed mb-4">
                    These terms of use, their subject matter and their formation, are governed by English law. You and we both agree that the courts of England and Wales will have exclusive jurisdiction to deal with any disputes between us.
                  </p>
                </section>

                <section className="mt-8">
                  <p className="leading-relaxed">
                    For questions about these terms, please contact us at <a href="mailto:hello@babybets.co.uk" className="font-bold cursor-pointer" style={{ color: '#496B71' }}>hello@babybets.co.uk</a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
