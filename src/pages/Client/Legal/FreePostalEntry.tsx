import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default function FreePostalEntry() {
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
              Free Postal Entry
            </h1>
            <p className="text-sm mb-12" style={{ color: '#78716c' }}>
              Last Updated: February 2026
            </p>

            <div className="prose prose-stone max-w-none" style={{ color: '#78716c' }}>
              <div className="space-y-6">
                {/* Introduction */}
                <section>
                  <p className="leading-relaxed mb-4">
                    At BabyBets, we offer a free postal entry route for all our competitions. This page explains how to enter competitions for free by post and the terms that apply.
                  </p>
                  <div
                    className="p-4 rounded-lg mb-6"
                    style={{ backgroundColor: '#e1eaec', borderWidth: '1px', borderColor: '#496B71' }}
                  >
                    <p className="font-bold mb-2" style={{ color: '#151e20' }}>
                      How Many Entries Do I Get?
                    </p>
                    <p className="text-sm">
                      The number of entries you receive per postal submission depends on the ticket price of the competition. Each postcard gives you entries equivalent to the value of a UK Second Class stamp (currently 87p) divided by the ticket price. For example:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>£2.00 ticket = 1 entry per postcard</li>
                      <li>£1.00 ticket = 1 entry per postcard</li>
                      <li>£0.50 ticket = 2 entries per postcard</li>
                      <li>£0.20 ticket = 5 entries per postcard</li>
                    </ul>
                  </div>
                </section>

                {/* Postal Entry Route */}
                <section>
                  <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Postal Entry Route
                  </h2>
                  <p className="leading-relaxed mb-4">
                    You may enter a BabyBets competition for free using our Postal Entry Route by complying with the conditions below.
                  </p>
                </section>

                {/* 1. Where to send your entry */}
                <section>
                  <h3 className="text-xl font-bold mb-3" style={{ color: '#151e20' }}>
                    1. Where to send your entry
                  </h3>
                  <p className="leading-relaxed mb-3">
                    Send your entry on an unenclosed postcard by First or Second Class post to:
                  </p>
                  <div
                    className="p-4 rounded-lg mb-3"
                    style={{ backgroundColor: '#fff0e6', borderWidth: '1px', borderColor: '#ffdec9' }}
                  >
                    <p className="font-bold" style={{ color: '#151e20' }}>BabyBets</p>
                    <p>Unit B2, Beacon House</p>
                    <p>Cumberland Business Centre</p>
                    <p>Portsmouth, Hampshire</p>
                    <p>PO5 1DS</p>
                  </div>
                  <p className="leading-relaxed italic">
                    Hand delivered entries will not be accepted.
                  </p>
                </section>

                {/* 2. What to include on the postcard */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    2. What to include on the postcard
                  </h3>
                  <p className="leading-relaxed mb-3">
                    Your postcard must clearly include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Your full name</li>
                    <li>Your full postal address</li>
                    <li>A contact telephone number</li>
                    <li>The email address linked to your BabyBets account</li>
                    <li>The name of the competition you want to enter</li>
                    <li>The answer to the competition question (where a question applies)</li>
                  </ul>
                  <p className="leading-relaxed italic">
                    Incomplete or illegible entries will be disqualified.
                  </p>
                </section>

                {/* 3. Account requirement */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    3. Account requirement
                  </h3>
                  <p className="leading-relaxed mb-3">
                    Entrants must have created a BabyBets account for a free postal entry to be processed.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The details on the postcard must match the details on the account.</li>
                    <li>Postal entries received without a matching registered account cannot be processed.</li>
                  </ul>
                </section>

                {/* 4. One postcard per entry request */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    4. One postcard per entry request (no bundles)
                  </h3>
                  <p className="leading-relaxed mb-3">
                    Each postcard counts as one postal entry request.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You may make multiple free entries for any competition (up to any entry limit stated on the competition page).</li>
                    <li>Each free entry must be sent on a separate postcard and posted separately.</li>
                    <li>Bulk entries in one envelope will not be accepted as multiple entries. If bulk entries are received, they will be counted as one single entry request.</li>
                  </ul>
                </section>

                {/* 5. Entry limits still apply */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    5. Entry limits still apply
                  </h3>
                  <p className="leading-relaxed mb-3">
                    If a competition has a maximum entry limit per person, that limit applies to postal entries too.
                  </p>
                  <p className="leading-relaxed">
                    If you send entries above the stated limit, we will only process entries up to the limit.
                  </p>
                </section>

                {/* 6. Closing dates, sell-outs and late entries */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    6. Closing dates, sell-outs and late entries
                  </h3>
                  <p className="leading-relaxed mb-3">
                    Your postcard must be received before the competition closing date and time shown on the competition page.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Entries received after the closing date will not be entered into the competition.</li>
                    <li>If the competition sells out before your valid postal entry is received, your entry will not be entered.</li>
                    <li>Postal entries received after a competition has closed or sold out are void and will not be credited or transferred.</li>
                  </ul>
                </section>

                {/* 7. No confirmation of entry */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    7. No confirmation of entry
                  </h3>
                  <p className="leading-relaxed mb-3">
                    We do not acknowledge receipt of postal entries and we do not confirm whether your entry has been successfully processed.
                  </p>
                  <p className="leading-relaxed">
                    If your postal entry is valid and received before the closing date, it will be entered into the relevant competition automatically. You will only be contacted if you win.
                  </p>
                </section>

                {/* 8. General */}
                <section>
                  <h3 className="text-xl font-bold mb-3 mt-6" style={{ color: '#151e20' }}>
                    8. General
                  </h3>
                  <p className="leading-relaxed mb-3">
                    By entering using the Postal Entry Route, you confirm that you are eligible to enter and that you accept our Terms and Conditions.
                  </p>
                  <p className="leading-relaxed">
                    For full details, please refer to our{' '}
                    <a href="/legal/website-terms" className="font-bold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: '#496B71' }}>
                      Website Terms of Use
                    </a>,{' '}
                    <a href="/legal/terms" className="font-bold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: '#496B71' }}>
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/legal/privacy" className="font-bold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: '#496B71' }}>
                      Privacy Policy
                    </a>.
                  </p>
                </section>

                {/* Postal Service Disclaimer */}
                <section>
                  <div
                    className="mt-8 p-6 rounded-lg"
                    style={{ backgroundColor: '#fff0e6', borderWidth: '1px', borderColor: '#ffdec9' }}
                  >
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#151e20' }}>
                      Postal Service Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                      We are not responsible for postal entries that are lost, delayed, damaged, or misdirected in the post. Proof of posting is not proof of receipt. Only postal entries received by us before the competition closing date and time will be valid.
                    </p>
                  </div>
                </section>

                {/* Additional Information */}
                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Additional Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#151e20' }}>
                        How are the number of entries calculated?
                      </h3>
                      <p className="leading-relaxed">
                        The number of entries you receive is calculated using the formula: entries_per_postcard = max(1, ceil(stamp_price_pence / ticket_price_pence)), where stamp_price_pence is currently 87p (the cost of a UK Second Class stamp).
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#151e20' }}>
                        Can I enter multiple competitions with one postcard?
                      </h3>
                      <p className="leading-relaxed">
                        No, each postcard can only be used to enter one competition. To enter multiple competitions, you must send separate postcards for each competition.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#151e20' }}>
                        Do I need to create an account before sending a postal entry?
                      </h3>
                      <p className="leading-relaxed">
                        Yes, you must create a free BabyBets account before sending your postal entry. The details on your postcard must match the details on your account for your entry to be valid.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#151e20' }}>
                        What happens if the stamp price changes?
                      </h3>
                      <p className="leading-relaxed">
                        If Royal Mail changes the price of a Second Class stamp, we will update our calculations site-wide. The number of entries you receive will always be based on the current Second Class stamp price at the time your entry is processed.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <h2 className="text-2xl font-bold mb-4 mt-8" style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}>
                    Questions?
                  </h2>
                  <p className="leading-relaxed">
                    If you have any questions about our free postal entry route, please contact us at{' '}
                    <a href="mailto:hello@babybets.co.uk" className="font-bold cursor-pointer hover:opacity-80 transition-opacity" style={{ color: '#496B71' }}>
                      hello@babybets.co.uk
                    </a>
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
