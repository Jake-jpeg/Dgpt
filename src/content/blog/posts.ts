export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  sections: {
    heading?: string;
    paragraphs?: string[];
    bullets?: string[];
    related?: { label: string; slug: string }[];
  }[];
  sources?: { label: string; url: string }[];
};

export const posts: Post[] = [
  {
    slug: "gun-permit-not-valid-ny-nj-transport",
    title: "Your gun is legal in Pennsylvania. Carry it into New York or New Jersey and it is a felony.",
    date: "July 30, 2026",
    description:
      "A Pennsylvania carry permit is not recognized in New York or New Jersey, and there is no reciprocity in any direction among the three states. New Jersey's second-degree crime and the Graves Act minimum, New York's definition of “loaded,” the magazine that is a violent felony with no gun required, the limits of the federal safe-passage law, out-of-state parts, and why a firearms conviction is its own immigration problem.",
    sections: [
      {
        paragraphs: [
          "You bought a handgun legally in Pennsylvania. You have the permit. You have carried it for years without a single problem. Then you drive down to Atlantic City for the weekend, or you head to Newark Airport to catch a flight, or your brother-in-law in Pennsylvania hands you a pistol and you drive it home to Queens. Nothing about how you think of yourself has changed. But the moment you cross that state line, you are committing a felony, and in New Jersey it is one of the most serious offenses in the code.",
          "This is general information, not legal advice. If you or a family member has been charged with a gun offense in New York or New Jersey, contact a lawyer immediately.",
        ],
      },
      {
        heading: "There is no reciprocity. Not in any direction.",
        paragraphs: [
          "The single most dangerous belief people carry across state lines is that a permit is like a driver's license. It is not. Among Pennsylvania, New York, and New Jersey, there is no honored permit in any pairing.",
          "New York does not recognize a carry permit from any other state, not one. New York issues its own licenses only to residents, part-time residents, or people principally employed or with their principal place of business in New York. New Jersey requires a permit to carry issued by New Jersey itself. So Pennsylvania into New Jersey is a crime. Pennsylvania into New York is a crime. New York into New Jersey is a crime, and New Jersey into New York is a crime. Every direction. All four.",
        ],
      },
      {
        heading: "New Jersey: this is a second-degree crime",
        paragraphs: [
          "People underestimate this badly. New Jersey law says that a person who knowingly possesses a handgun without first having obtained a permit to carry the same is guilty of a crime of the second degree. In New Jersey, second degree is the tier that sits just below the most serious offenses in the code, and it carries a presumption of state prison.",
          "On top of that, New Jersey has the Graves Act. For an unlawful handgun possession offense, the Graves Act imposes a mandatory period of parole ineligibility, the greater of forty-two months or one-half of the sentence imposed. That is a mandatory minimum before parole is even on the table, on a charge that a person from Pennsylvania often did not know they were committing.",
        ],
      },
      {
        heading: "New York: “loaded” does not mean what you think it means",
        paragraphs: [
          "New York's trap is different and, in its own way, sneakier. New York's most serious street-level gun charge is second-degree criminal possession of a weapon, a class C felony, which covers possessing a loaded firearm outside your home or place of business.",
          "Here is the part that catches careful people. New York defines a loaded firearm as a firearm loaded with ammunition or a firearm possessed by someone who at the same time possesses ammunition that could be fired from it. Read that again. You unloaded the gun. You put the gun in one locked case and the ammunition in a separate locked case and put both in the trunk. Under New York's definition, that is still a loaded firearm, because you possess the gun and the ammunition at the same time. A genuinely unloaded handgun with no ammunition anywhere drops to third-degree possession, still a class E felony.",
        ],
      },
      {
        heading: "The magazine by itself is a violent felony in New York, no gun required",
        paragraphs: [
          "This one deserves its own warning, because it does not need a firearm anywhere in the picture.",
          "New York defines a large capacity ammunition feeding device as a magazine, belt, drum, feed strip, or similar device with a capacity of, or that can be readily restored or converted to accept, more than ten rounds. Possessing one is criminal possession of a weapon in the third degree, a class D felony. And New York's violent felony statute lists that exact subdivision by number among its class D violent felony offenses. So yes: a magazine over the line is a violent felony charge.",
          "Notice what is not an element of that offense. The gun is not. A spare fifteen-round magazine sitting in a glovebox or a range bag, with the pistol left at home in Pennsylvania, is enough. The only carve-outs in the definition are narrow, an attached tubular device that only takes .22 rimfire, and a genuine fifty-year-old curio or relic that has been registered with the State Police. There is no general grandfather clause for the magazines people already own.",
          "Two honest refinements. First, unlike New Jersey's Graves Act, this charge is not a locked mandatory minimum: New York's sentencing statute carves out this subdivision and allows a definite sentence or, for a defendant without a recent misdemeanor record where prison would be unduly harsh, an alternative sentence. That is a judge's decision rather than the prosecutor's, and it is the one place in this whole area where the law is somewhat gentler than New Jersey. Second, New Jersey draws the same ten-round line. A magazine capable of holding more than ten rounds is a large capacity ammunition magazine, and possessing one is a fourth-degree crime there.",
        ],
      },
      {
        heading: "And in New Jersey, the ammunition itself can be a charge",
        paragraphs: [
          "New Jersey criminalizes possession of hollow-point ammunition as a fourth-degree crime, with narrow exceptions, one of which lets a person keep it at their own home. Hollow points are ordinary defensive ammunition in much of the country. What the exceptions do not cover is having them with you in a car crossing the state, which is exactly how they end up stacked on top of a gun charge.",
        ],
      },
      {
        heading: "The federal “safe passage” law does less than people think",
        paragraphs: [
          "There is a federal statute, often called FOPA, that protects transporting a firearm through a state. It is real, but it is narrow, and reading it carefully shows why it rarely helps in these cases.",
          "It only protects transport from a place where you may lawfully possess and carry the firearm to another place where you may lawfully possess and carry it. So it does nothing at all when New York or New Jersey is your destination, because there is no lawful possession waiting for you at the other end. It also requires the firearm to be unloaded and requires that neither the firearm nor the ammunition be readily accessible or directly accessible from the passenger compartment; if the vehicle has no separate compartment, they must be in a locked container that is not the glove compartment or console.",
          "That last clause is why one group gets caught in this more than anyone else: commercial truck drivers. A sleeper cab has no trunk. There is no compartment separate from the passenger compartment, which means the mechanical setup the statute demands often does not physically exist in the vehicle. Combine that with crossing state lines constantly, weigh stations, and commercial-vehicle enforcement, and a driver who is perfectly legal at home is structurally exposed the whole way up the corridor. But the same problem reaches anyone in a car without a trunk.",
        ],
      },
      {
        heading: "Ordering the part from Texas does not make the part legal here",
        paragraphs: [
          "This is its own trap, and it has nothing to do with driving anywhere. A part ships to your door from Texas or Ohio, entirely lawfully on the seller's end, and you install it. The lawful shipment did not create lawful possession.",
          "Understand why the internet feels safe here. Under federal law, magazines and most accessories are not firearms at all, so shipping them across state lines is generally unremarkable. Nothing about that federal silence speaks to what New York and New Jersey criminalize once the box is open in your kitchen.",
          "And in both states, one part can change what your gun legally is. New Jersey's definition of assault firearm reaches parts designed or intended to convert a firearm, and parts that can be readily assembled into an assault firearm. Possessing an assault firearm in New Jersey is a crime of the second degree. New York works through a single-feature test: a semiautomatic rifle or pistol that can accept a detachable magazine becomes an assault weapon if it has even one listed feature, a threaded barrel, a barrel shroud, a second handgrip, a folding or telescoping stock, and others. Add one accessory to a rifle that was perfectly legal that morning and you have manufactured a felony out of a hobby purchase.",
        ],
      },
      {
        heading: "You cannot register your way out of it, the windows are closed",
        paragraphs: [
          "People assume there is paperwork that fixes this. The reality is harder than that: in both states, the registration door has been shut for years.",
          "New York's registration requirement applied to people who lawfully possessed a qualifying assault weapon before January 15, 2013, and the deadline to register was April 15, 2014. It was a one-time grandfather, not an open process. There is no form today for a weapon you configured last month. New Jersey's window was narrower still: registration ran for one year from the 1990 statute, applied only to firearms purchased on or before May 1, 1990, and was limited to firearms on the Attorney General's target-shooting list with proof of membership in a pre-existing rifle or pistol club. Neither state is accepting new registrations for a newly configured gun. So the answer to whether you can simply register it is generally no.",
        ],
      },
      {
        heading: "Who actually gets charged",
        paragraphs: [
          "The out-of-state seller is not legally untouchable. New York makes transporting or shipping an assault weapon or large capacity feeding device a class D felony, New Jersey makes shipping an assault firearm a third-degree crime and shipping a large capacity magazine a fourth-degree crime, and New Jersey reaches even the distribution of digital firearm design files to unlicensed people in the state as a second-degree crime. New York added its own misdemeanor offenses for distributing and possessing digital firearm-manufacturing code.",
          "But there is a gap between what the law allows and what actually happens. Whether a seller in another state ever answers for it depends on jurisdiction, resources, and whether federal authorities have their own interest in that person. The exposure that reliably lands is the owner's. You are the one standing next to it, in this state, with your name on it.",
        ],
      },
      {
        heading: "The switch changes everything about the conversation",
        paragraphs: [
          "If a conversion device is in the picture, this stops being a paperwork argument. Federal law defines a machinegun to include any part designed and intended solely and exclusively, or combination of parts designed and intended, for use in converting a weapon into a machinegun, meaning the little device is itself legally a machine gun, on its own. New Jersey makes possession of a machine gun or any instrument or device adaptable for use as a machine gun a crime of the second degree. And New York has just moved in this area: under a 2026 enactment effective August 25, 2026, a convertible pistol with a pistol converter installed is treated as a machine-gun under New York law, along with new offenses covering dealer sales of convertible pistols and the distribution of digital firearm code.",
          "Prosecutors read a collection as a whole. What else was in the safe, whether anything was set up for rapid fire, whether serial numbers were present, those facts shape the charging decision far more than a person's own sense of themselves as a careful hobbyist. Which is the real point: in New York and New Jersey, gun hobbying is not a hobby. It is a strict-compliance area, and the standard is the statute's, not the enthusiast's.",
        ],
      },
      {
        heading: "The uncomfortable comparison",
        paragraphs: [
          "New Jersey has a written framework for out-of-state gun owners charged under the Graves Act. New York has no equivalent directive for its handgun charge. Which produces a result most people would never guess: for the same honest mistake with a handgun, a first-time out-of-state owner can end up in a worse position in New York than in New Jersey. Nobody plans around this, because nobody knows it.",
        ],
      },
      {
        heading: "About what you say when you are stopped",
        paragraphs: [
          "An officer on a traffic stop will very often ask directly whether there is a weapon in the vehicle. What happens next tends to decide the whole case.",
          "If someone denies it and the firearm is then found in a place the officer can lawfully search, the situation gets dramatically worse. The concealment becomes part of the story the prosecutor tells, and it closes doors that might otherwise have stayed open. And this is not just a matter of tone. New Jersey's Attorney General has issued a directive on Graves Act cases that treats out-of-state gun owners as a recognized category, and it says so in writing: relief may be considered where the person acquired the weapon lawfully, where possession would have been legal in their home state, and where they honestly believed their possession was lawful in New Jersey. Among the factors listed are voluntary disclosure of the firearm to law enforcement and surrender of an unloaded weapon. The directive draws the line plainly, a suspect who voluntarily surrendered a firearm is treated differently from one who concealed its existence until police found it.",
          "Where those conditions are met, the available outcomes include diversion or a waiver that can bring the parole bar down from forty-two months to twelve, or to probation. But note who decides: the waiver is the prosecutor's call, not the defendant's. It is something to be argued for, not something anyone is owed.",
        ],
      },
      {
        heading: "If you are not a U.S. citizen, a gun conviction is its own immigration problem",
        paragraphs: [
          "This is where the damage becomes permanent. Immigration law makes a firearms conviction a separate, standalone ground of deportability. It does not require anyone to argue about whether the crime involved moral turpitude, and it does not depend on the length of the sentence. It reaches lawful permanent residents, green card holders, directly.",
          "So a Pennsylvania permit holder with a green card who drives into New Jersey with a legally purchased handgun is not only facing a second-degree crime and a mandatory minimum. They are facing a conviction category built to end their status in this country. The criminal case and the immigration consequence have to be handled as one problem, from the first day, by someone watching both.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "Your permit stops at the state line, and nothing about your good intentions travels with you. New Jersey treats the handgun as a second-degree crime with a mandatory minimum. New York can call your carefully separated gun and ammunition loaded, and can charge the oversized magazine as a violent felony with no gun at all. A part that shipped to you lawfully from another state is still illegal to possess here, and the registration windows that people assume exist closed years ago. There is a narrow path to mercy in New Jersey for the person who was honestly mistaken and did not hide anything, but it is a path someone has to walk you down, and it belongs to the prosecutor to grant.",
          "We defend felony charges in New York and indictable offenses in New Jersey, and when a client is not a U.S. citizen, the immigration exposure is reviewed alongside the criminal case from the first call.",
        ],
      },
    ],
    sources: [
      { label: "N.J.S.A. 2C:39-5 - unlawful possession of a handgun without a New Jersey permit to carry (second degree); machine guns and devices adaptable for use as a machine gun (second degree); assault firearms (second degree)", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-39-5/" },
      { label: "N.J.S.A. 2C:43-6(c) - Graves Act mandatory period of parole ineligibility (greater of 42 months or one-half the sentence)", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-43-6/" },
      { label: "N.J.S.A. 2C:43-6.2 - prosecutor-initiated waiver of the Graves Act minimum", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-43-6-2/" },
      { label: "N.J.S.A. 2C:39-3 - hollow-point ammunition and large capacity ammunition magazines (fourth degree)", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-39-3/" },
      { label: "N.J.S.A. 2C:39-1 - definitions of assault firearm and large capacity ammunition magazine (more than 10 rounds)", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-39-1/" },
      { label: "N.J.S.A. 2C:58-12 - registration of assault firearms (one-year window from the 1990 statute; firearms purchased on or before May 1, 1990)", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-58-12" },
      { label: "N.J.S.A. 2C:39-9 - manufacture, transport, shipment and sale of assault firearms and large capacity magazines; firearm parts and unserialized frames or receivers; 3D-printing and digital design files", url: "https://codes.findlaw.com/nj/title-2c-the-new-jersey-code-of-criminal-justice/nj-st-sect-2c-39-9/" },
      { label: "New Jersey Attorney General - Clarification of the Graves Act 2008 Directive with respect to offenses committed by out-of-state visitors from states where their gun possession was lawful (2014)", url: "https://www.nj.gov/oag/dcj/agguide/directives/Graves-Act-clarification-2014.pdf" },
      { label: "N.Y. Penal Law 265.03 - criminal possession of a weapon in the second degree (class C felony)", url: "https://www.nysenate.gov/legislation/laws/PEN/265.03" },
      { label: "N.Y. Penal Law 265.02 - criminal possession of a weapon in the third degree, including subdivision 8 (large capacity ammunition feeding device), a class D felony", url: "https://www.nysenate.gov/legislation/laws/PEN/265.02" },
      { label: "N.Y. Penal Law 265.01-b - criminal possession of a firearm (class E felony)", url: "https://www.nysenate.gov/legislation/laws/PEN/265.01-B" },
      { label: "N.Y. Penal Law 265.00 - definitions, including loaded firearm (subdivision 15), assault weapon (subdivision 22), large capacity ammunition feeding device (subdivision 23), and pistol converter", url: "https://www.nysenate.gov/legislation/laws/PEN/265.00" },
      { label: "N.Y. Penal Law 70.02 - violent felony offenses and sentencing, listing 265.02(8) as a class D violent felony offense and providing the alternative-sentence provision", url: "https://www.nysenate.gov/legislation/laws/PEN/70.02" },
      { label: "N.Y. Penal Law 265.10 - manufacture, transport, shipment and disposal of assault weapons and large capacity ammunition feeding devices; convertible pistols and digital firearm code", url: "https://www.nysenate.gov/legislation/laws/PEN/265.10" },
      { label: "N.Y. Penal Law 265.63 - criminal sale of an unfinished frame or receiver", url: "https://www.nysenate.gov/legislation/laws/PEN/265.63" },
      { label: "New York State Police - pistol permit eligibility and out-of-state permits", url: "https://troopers.ny.gov/pistol-permit" },
      { label: "18 U.S.C. 926A - interstate transportation of firearms (safe passage)", url: "https://www.law.cornell.edu/uscode/text/18/926A" },
      { label: "26 U.S.C. 5845(b) - definition of machinegun, including any part or combination of parts designed and intended for use in converting a weapon into a machinegun", url: "https://www.law.cornell.edu/uscode/text/26/5845" },
      { label: "8 U.S.C. 1227(a)(2)(C) - firearms offenses as a ground of deportability", url: "https://www.law.cornell.edu/uscode/text/8/1227" },
    ],
  },
  {
    slug: "warrant-out-for-arrest-what-to-do",
    title: "There is a warrant out for your arrest. What should you do?",
    date: "July 29, 2026",
    description:
      "Running and waiting are the two worst options. Why a voluntary surrender arranged through counsel is usually the strongest move, how New Jersey and New York decide release under two very different reform statutes, what an NYPD I-card actually is and is not, and why a noncitizen has to surrender the right way.",
    sections: [
      {
        paragraphs: [
          "Learning that there is a warrant out for you, or that the police are looking for you, is frightening, and the instinct is usually one of two things: panic and hide, or pretend it will go away. Both are almost always the wrong move. A warrant is a problem you want to solve on your terms, not the police's, and the smart way to do that depends on where you are and what the charge is.",
          "This is general information, not legal advice. If you believe there is a warrant for you, speak with a lawyer before you do anything else.",
        ],
      },
      {
        heading: "Do not run, and do not ignore it",
        paragraphs: [
          "A warrant does not expire because you avoid it. Ignoring one simply means you will be arrested on someone else's timing, at a traffic stop, at your workplace, at the airport, in front of your children, and often at the worst possible moment to arrange your release. Running is worse still: it hands the prosecutor the single argument that hurts you most, that you are a flight risk. The goal is the opposite of running. It is to take control of how and when you come in.",
        ],
      },
      {
        heading: "Often, the best move is a voluntary surrender arranged through a lawyer",
        paragraphs: [
          "Turning yourself in, set up in advance by counsel, is frequently the strongest option available. It lets you choose the timing and the circumstances instead of being caught off guard. And here is the part most people do not realize: it directly strengthens your release argument. Showing up voluntarily is powerful evidence that you are not a flight risk, which is exactly what the judge is weighing when deciding whether you go home or sit in custody while the case plays out. Depending on the charge, that one factor can decide it.",
        ],
      },
      {
        heading: "New York and New Jersey decide release very differently",
        paragraphs: [
          "This is where the state matters, a lot.",
          "In New Jersey, the 2017 reforms nearly eliminated cash bail. Instead, a risk assessment drives what happens: you are either released with conditions, or the prosecutor asks the judge to detain you until trial at a detention hearing. Your ties to the community, your record, and how you came into custody all feed that decision, which is exactly why walking in voluntarily, with a lawyer, matters.",
          "In New York, the 2019 reforms mean most misdemeanors and non-violent felonies result in release without bail. But for bail-eligible charges, violent felonies and certain others, a judge still sets bail or conditions based on the risk that you will not return to court. That is precisely the moment a voluntary surrender and a prepared argument carry the most weight.",
          "In either state, on a serious charge, the case that you are not a flight risk has to be built and argued. This is not a do-it-yourself moment.",
        ],
      },
      {
        heading: "A note for New Yorkers: the I-card",
        paragraphs: [
          "If what you are hearing is that the NYPD has an I-card on you, understand what that actually is. An I-card is not a warrant. Only a judge issues a warrant; the NYPD issues I-cards internally. It is an investigation card flagging that the police want to arrest or question a particular person. Because it is an internal police document and not a court warrant entered in the statewide and national databases, it generally does not follow you outside New York City.",
          "Do not mistake that for harmless, though. Inside the city, an I-card is enough for the NYPD to arrest you, and it can turn into an actual warrant. If you learn there is an I-card on you, that is a reason to call a lawyer now, not to wait and see.",
        ],
      },
      {
        heading: "If you are not a U.S. citizen, surrender the right way",
        paragraphs: [
          "For a noncitizen, how a warrant is handled matters twice over. Getting arrested and booked into jail can put you on immigration's radar and lead to an immigration detainer, a request that the jail hold you for ICE, which can pull you out of the criminal system and into immigration detention before the criminal case is even resolved. A deliberate surrender, handled by counsel who is watching both sides and has a release plan ready, is how a criminal problem is kept from becoming a deportation one.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "A warrant is not something to run from or bury your head about. The move is almost always the same: call a lawyer, and where it makes sense, surrender voluntarily with the release argument already built. Done right, you walk in on your schedule, with your best foot forward, and often walk back out. Done wrong, by waiting or by running, you give away the very arguments that would have kept you free.",
          "We defend felony charges in New York and indictable offenses in New Jersey, and when a client is not a U.S. citizen, the immigration exposure is reviewed alongside the criminal case from the first call.",
        ],
      },
    ],
    sources: [
      { label: "New Jersey Courts - Criminal Justice Reform (risk-based pretrial release and detention)", url: "https://www.njcourts.gov/public/concerns/criminal-justice-reform" },
      { label: "N.Y. Criminal Procedure Law 510.10 - securing orders; release on recognizance, conditions, and bail", url: "https://www.nysenate.gov/legislation/laws/CPL/510.10" },
      { label: "U.S. Immigration and Customs Enforcement - immigration detainers", url: "https://www.ice.gov/identify-and-arrest/detainers" },
    ],
  },
  {
    slug: "arrested-jfk-out-of-state-warrant-extradition",
    title: "Your family member was arrested at JFK on a New Jersey warrant. What now?",
    date: "July 29, 2026",
    description:
      "An arrest in one state on another state's warrant looks like chaos, but the route through it is narrow and well marked. What the Uniform Criminal Extradition Act actually decides, why waiving extradition is usually the right call, the difference between a few days and roughly ninety, and what an immigration detainer does to all of it.",
    sections: [
      {
        paragraphs: [
          "Here is a situation that feels like pure chaos: a family member is stopped at JFK and arrested, not on anything that happened in New York, but on an active warrant out of New Jersey. Now they are sitting in a New York jail on a New Jersey case, and it looks like two states are tangled together with your relative stuck in the middle. Take a breath. The path through this is actually fairly clear, and moving in the right direction quickly is what matters.",
          "This is general information, not legal advice. If a family member has been arrested on an out-of-state warrant, contact a lawyer right away.",
        ],
      },
      {
        heading: "What is actually happening: New York is just the waiting room",
        paragraphs: [
          "When someone is arrested in New York on another state's warrant, New York is not prosecuting them. New York is the holding state. New Jersey, the state that issued the warrant, is the one that wants them back. Under the interstate extradition process, in New York the Uniform Criminal Extradition Act at Criminal Procedure Law Article 570, New York holds the person while New Jersey arranges to bring them home to face the actual case. The New York court is not deciding guilt or the New Jersey charges. It is only handling the handoff.",
        ],
      },
      {
        heading: "Usually, the right move is to waive extradition",
        paragraphs: [
          "Under New York Criminal Procedure Law 570.50, the person can sign a waiver, in writing and in front of a judge, consenting to be returned to New Jersey without forcing New Jersey to go through the full governor's-warrant process first. In almost every ordinary case, waiving is the smart play, for two reasons.",
          "First, the fight is almost never winnable. The extradition hearing is extremely narrow: it looks only at whether your family member is the person named in the warrant, whether they are truly a fugitive, and whether New Jersey's paperwork is in order. It does not touch guilt or innocence, which belongs to New Jersey. So contesting rarely changes anything; it mostly just keeps the person sitting in a New York jail.",
          "Second, the real fight, the fight over release, happens in New Jersey, not New York. Waiving gets your family member in front of a New Jersey judge faster, and that is where release while the case moves forward can be argued. The sooner they are there, the sooner that argument can be made.",
        ],
      },
      {
        heading: "The timing, honestly",
        paragraphs: [
          "If your family member waives extradition, the transport to New Jersey usually takes somewhere between a few days and about two weeks, depending on how backed up the county and the transport are at that moment. If they contest it, the law lets New Jersey hold them far longer, an initial period of up to thirty days, extendable up to roughly ninety days in total, while the governor's-warrant paperwork moves back and forth between the two states. That gap, days versus potentially months, is the whole argument for waiving in most cases.",
        ],
      },
      {
        heading: "But nothing gets signed before a lawyer is involved",
        paragraphs: [
          "Waiving is usually right, but it is a decision, not a reflex. There are narrow situations, a genuine case of mistaken identity or a specific strategic reason, where you would not waive, and the judge is required to explain the person's rights before they give up any of them. Just as important: the entire point of getting to New Jersey quickly is to make the release argument on arrival. So the waiting time should be used, not wasted. The New Jersey release argument can be built while the transfer is being arranged, so your family member is not starting from zero when they get there. The worst version of this is waiving blindly and then showing up in New Jersey with no plan.",
        ],
      },
      {
        heading: "If your family member is not a U.S. citizen, be extra careful",
        paragraphs: [
          "For a noncitizen, this kind of custody, held in one state and transferred to another, is exactly when immigration authorities can attach an immigration detainer, a request that the jail hold the person for ICE. That can turn a two-week criminal detour into an immigration hold, and pull someone out of the criminal process and into immigration detention. On top of that, the underlying New Jersey charge, however it is ultimately resolved, can carry immigration consequences of its own. For someone who is not a citizen, the criminal case, the extradition, and the immigration exposure all have to be handled together, from the very first phone call.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "An arrest on an out-of-state warrant feels like a disaster, but the route through it is usually straightforward: waive extradition, with a lawyer, get to New Jersey as fast as possible, and be ready to argue for release the minute you arrive. What costs families the most is the opposite, sitting still, contesting a hearing that will not be won, and arriving with no plan.",
          "We defend felony charges in New York and indictable offenses in New Jersey, and when a client is not a U.S. citizen, the immigration exposure is reviewed alongside the criminal case from the first call.",
        ],
      },
    ],
    sources: [
      { label: "N.Y. Criminal Procedure Law, Article 570 - Uniform Criminal Extradition Act (interstate extradition process)", url: "https://www.nysenate.gov/legislation/laws/CPL/A570" },
      { label: "N.Y. Criminal Procedure Law 570.50 - waiver of extradition (consent to return to the demanding state)", url: "https://www.nysenate.gov/legislation/laws/CPL/570.50" },
      { label: "U.S. Immigration and Customs Enforcement - immigration detainers", url: "https://www.ice.gov/identify-and-arrest/detainers" },
    ],
  },
  {
    slug: "airport-cash-over-10000-reporting-lawyer",
    title: "Your family member was detained at the airport for carrying over $10,000 in cash. Can a lawyer be there with them?",
    date: "July 29, 2026",
    description:
      "No lawyer sits in on a border inspection, and understanding why explains what actually matters here. Carrying the money is legal; failing to report it is the offense. What seizure and civil forfeiture look like in practice, and why a money-laundering allegation over $10,000 is an aggravated felony for a noncitizen.",
    sections: [
      {
        paragraphs: [
          "Someone in the family flies in, or is about to fly out, carrying more than $10,000 in cash, does not report it, and gets pulled aside. Now they are in a back room at the airport, the money is gone, and everyone wants to know one thing: can we send a lawyer in there right now? The honest answer is no, and understanding why tells you exactly what matters instead.",
          "This is general information, not legal advice. If a family member is detained at the border over cash, call a lawyer the moment they are out.",
        ],
      },
      {
        heading: "No, a lawyer cannot go in there with them",
        paragraphs: [
          "This is the hard part for families to accept. The airport inspection area is not a police station, and it is not a courtroom. It is the border, and the border runs by different rules. Customs and Border Protection, and the other federal agencies that work the ports of entry, do not have to let a lawyer sit in on their inspection, and they usually will not. The Sixth Amendment right to counsel does not attach during a border inspection; it comes into play later, once someone is actually charged or placed into removal proceedings. During the inspection itself, there is no right to counsel in the room, and there is no Miranda warning either. No lawyer, however good, can walk in and stop that questioning. That is simply not how the border works.",
        ],
      },
      {
        heading: "It is not a tax. It is a reporting rule.",
        paragraphs: [
          "The biggest misunderstanding is worth clearing up first, because it causes real panic. Carrying more than $10,000 into or out of the United States is completely legal. There is no tax on the money. Nobody is being charged for bringing it. The only requirement is that it be reported, on a form called FinCEN Form 105, so the government has a record of large sums crossing the border. That is it. In practice it is close to an honor system: declare it, keep it, and walk. The trouble is never the cash. The trouble is only the failure to report it.",
        ],
      },
      {
        heading: "What actually goes wrong: they take the money",
        paragraphs: [
          "Here is what makes these cases sting. When someone fails to report, the government can seize the cash on the spot and move to keep it through civil forfeiture, and separately, failing to report is itself a federal crime. So the family walks out with the person but without the money, and now faces a fight to get it back. And here is the part worth being clear-eyed about: these cases are hard to win, and it is common to end up giving back some portion of the money to resolve it. That is the reality, and it is better heard on day one than promised away.",
        ],
      },
      {
        heading: "Where the lawyer actually helps",
        paragraphs: [
          "Two things are worth understanding. First, lying to federal agents is its own separate crime, and it turns a paperwork problem into a much worse one. The instinct to explain your way out, to shade the number, to invent a story, that is what buries people. Second, the lawyer's work is not in the inspection room, it is everything after it. There is a formal process to contest the seizure and petition for the money back, and there is the criminal exposure to manage. That is real legal work, and it is where counsel makes the difference between losing all of it and getting some or most of it back.",
        ],
      },
      {
        heading: "If your family member is not a U.S. citizen, this gets more serious",
        paragraphs: [
          "For a noncitizen, a cash case can reach far past the money. If the government believes the cash is tied to any unlawful activity, the exposure is no longer just forfeiture; it can move toward money-laundering territory, and under immigration law a money-laundering offense involving more than $10,000 is an aggravated felony, one of the most damaging labels in the entire immigration code. An aggravated felony can mean detention and deportation with almost no relief available. Even short of that, a federal case of any kind can put a noncitizen on immigration's radar. This is precisely the situation where the criminal side and the immigration side have to be handled together, by someone watching both, from the very first day.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "No lawyer can sit in the inspection room. The border does not allow it. But that is not where this is won or lost. It is won afterward, by counsel who can fight the seizure and manage the exposure. The money itself was never illegal; only the failure to report it was. And if the person is not a citizen, the stakes climb fast, which is exactly why both sides should be watched from the first phone call.",
          "We defend felony charges in New York and indictable offenses in New Jersey, and when a client is not a U.S. citizen, the immigration exposure is reviewed alongside the criminal case from the first call.",
        ],
      },
    ],
    sources: [
      { label: "31 U.S.C. 5316 - reports on exporting and importing monetary instruments (the $10,000 report; FinCEN Form 105)", url: "https://www.law.cornell.edu/uscode/text/31/5316" },
      { label: "31 U.S.C. 5317 - search and forfeiture of monetary instruments (seizure and forfeiture for failure to report)", url: "https://www.law.cornell.edu/uscode/text/31/5317" },
      { label: "U.S. Customs and Border Protection - currency and monetary instruments over $10,000 must be reported", url: "https://www.cbp.gov/travel/international-visitors/kbyg/money" },
      { label: "8 U.S.C. 1101(a)(43)(D) - aggravated felony includes money laundering where the funds exceeded $10,000", url: "https://www.law.cornell.edu/uscode/text/8/1101" },
    ],
  },
  {
    slug: "family-member-arrested-what-to-do",
    title: "A family member was just arrested. Here is exactly what to do.",
    date: "July 29, 2026",
    description:
      "The first hours after an arrest decide more than most families realize. Why counsel comes before any explaining, what it means for the lawyer to make the record, why the Fifth and Sixth Amendment rights are not technicalities, and why for a noncitizen the plea that ends the case can be the thing that starts a deportation.",
    sections: [
      {
        paragraphs: [
          "This is the call we get most often: a husband, a wife, a son, a parent has just been arrested, and the family is frightened and does not know what to do in the first few hours. Take a breath. The right steps in those first hours are simple, and getting them right protects the person you love more than almost anything that happens later.",
          "This is general information, not legal advice. If a family member has been arrested, contact a lawyer right away.",
        ],
      },
      {
        heading: "Counsel comes before anyone explains anything",
        paragraphs: [
          "The single most important step is also the first one: get a lawyer involved immediately, before your family member talks to the police. Not after the interview. Before it. The instinct in most families is to cooperate, to be polite, to clear things up by explaining. That instinct, however good-hearted, is exactly what causes the most damage. The purpose of a lawyer at this stage is to get in front of the questioning, not to clean up after it.",
        ],
      },
      {
        heading: "The lawyer makes the record: this person is represented",
        paragraphs: [
          "Once there is counsel, the lawyer's early job is to make a clear, professional record with the police and the prosecutor: this person is represented by counsel, and there should be no questioning of them outside their lawyer's presence. Done properly, that record invokes two of the most important protections a person has, and it tells everyone involved that the conversation goes through the lawyer from that point on.",
        ],
      },
      {
        heading: "The right to remain silent is not a technicality",
        paragraphs: [
          "The right to remain silent and the right to counsel are constitutional rights, under the Fifth and Sixth Amendments, and they belong to your family member no matter how the questions are asked or how friendly they seem. The message worth passing along is short: politely decline to answer questions until the lawyer is present. Not rude, not combative. Just a request for counsel, and then nothing further.",
        ],
      },
      {
        heading: "If your family member is not a U.S. citizen, the stakes are doubled",
        paragraphs: [
          "Here is what many families do not realize until it is too late. If the person arrested is not a U.S. citizen, a green card holder, a visa holder, anyone, the criminal case is not only a criminal case. What they say, and above all how the case is ultimately resolved, can put their immigration status at risk. A plea that looks like a minor way to make the case go away can, for a noncitizen, be the very thing that starts a deportation. That is why the criminal side and the immigration side have to be looked at together from the very first day, not bolted on at the end. Defense counsel who understands those immigration consequences, and who coordinates with immigration counsel when needed, is not a luxury here. It is the difference between a closed case and a lost life in this country.",
        ],
      },
      {
        heading: "In the first hours, practically",
        paragraphs: [
          "Find out where your family member is being held and what the charges are. The facts of the case do not belong on jail phones or in visiting-room lines, which are recorded, and everything said there can be used. Gather what the lawyer will need, the person's full name, date of birth, immigration status, and where they are held, and let the lawyer handle contact with the police and any question of bail. The less that is said by anyone before the lawyer is in place, the better.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "When someone you love is arrested, the first hours matter and the rules are simple: get a lawyer, say nothing without that lawyer, and let the lawyer make the record. Everything else can be sorted out from there. What is hard to undo is a statement or a plea made before anyone thought to slow down.",
          "We defend felony charges in New York and indictable offenses in New Jersey, and when a client is not a U.S. citizen, the immigration exposure is reviewed alongside the criminal case from the first call.",
        ],
      },
    ],
    sources: [
      { label: "U.S. Constitution, Fifth Amendment - the right against self-incrimination", url: "https://constitution.congress.gov/constitution/amendment-5/" },
      { label: "U.S. Constitution, Sixth Amendment - the right to the assistance of counsel", url: "https://constitution.congress.gov/constitution/amendment-6/" },
      { label: "Immigration and Nationality Act 237(a)(2) (8 U.S.C. 1227(a)(2)) - criminal grounds of deportability", url: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title8-section1227" },
    ],
  },
  {
    slug: "moving-to-korea-during-divorce-custody-green-card",
    title: "Moving back to Korea during a divorce? Be careful before you make that call.",
    date: "July 19, 2026",
    description:
      "For Korean-American families: the impulse to retreat to Korea during marital conflict or divorce can quietly damage your custody position, and, if you hold a green card, your immigration status. What to weigh before you go.",
    sections: [
      {
        paragraphs: [
          "When a marriage is in trouble, and especially when it is turning into a divorce, we see the same impulse again and again in Korean families: go home. One spouse wants to retreat to Korea for space and the comfort of family. Sometimes a parent takes the children there. It is a deeply human reaction to conflict. But made in the heat of the moment, that single decision can quietly cost you on two fronts you may not be weighing: your position in the divorce itself, above all custody, and, if you hold a green card, your immigration status. This is not a reason to feel trapped here. It is a reason to make the decision with your eyes open and with advice, before you get on the plane.",
          "This is general information, not legal advice. These situations turn on specific facts and should be reviewed with your own attorney.",
        ],
      },
      {
        heading: "Leaving during a divorce can change your case, especially with children",
        paragraphs: [
          "Moving out of the marital home, by itself, does not give up your share of it; your interest in marital property does not vanish because you slept somewhere else. But where you go, and who goes with you, can shape the case in ways that are hard to undo. Courts pay close attention to who has been the children's day-to-day caregiver and to the existing routine, and a sudden change to that picture rarely helps the parent who caused it.",
          "The truly serious move is taking the children. Unilaterally removing the children from the home, the state, or the country during a divorce, or before there is a custody order, is one of the most damaging things a parent can do to their own custody position. In New Jersey, the law is explicit: under N.J.S.A. 9:2-2, the children of divorced or separated parents who are covered by the statute cannot be removed from the state without the consent of both parents or a court order. New York does not put that rule on autopilot, but a parent who simply takes the kids and leaves should expect an emergency application to bring them back, and a relocation done without permission weighs heavily against them when custody is decided.",
          "Taking the children to Korea raises the stakes another level. It can be treated as international parental child abduction. Korea is a partner to the Hague Convention on international child abduction, but in practice, getting a child returned from Korea has been slow and uncertain, so the other parent may be facing a long, painful fight, and the parent who left can be cast as the one who took the children. That is a very hard hole to climb out of in a custody case, and it can color everything that follows.",
          "There is also the question of which court even decides custody. That generally depends on where the children have actually been living, their home state. Moving to Korea can, over time, complicate or shift that, turning what could have been a straightforward local case into a cross-border tangle nobody wanted.",
          "None of this means you can never go. It means that moving out with the children, and above all taking them to Korea, during a divorce is a decision to make with your divorce lawyer first, ideally with a written agreement or a court order in hand, not a suitcase.",
        ],
      },
      {
        heading: "And if you hold a green card, there is a second landmine",
        paragraphs: [
          "We are divorce lawyers. The immigration side of this we handle by bringing in trusted immigration counsel, and a spouse thinking about a long stay in Korea during a divorce is exactly the situation where you want that, early, because the stakes are easy to miss.",
          "Here is the short version of why. A green card is not a return ticket you can use whenever you like. Once a permanent resident is outside the United States for more than about six months, they are treated as seeking admission again on the way back and can be questioned about whether they gave up their residence; once a trip reaches a full year, the green card is generally no longer valid to travel on at all, and the law presumes the residence was abandoned. There is a protection, a reentry permit that can cover a stay of up to two years, but it has to be applied for while the person is still physically in the United States. It is useless once you are already sitting in Seoul. So a spouse who leaves in anger for several months can come home to find their immigration status in question on top of the divorce. If a long stay in Korea is even on the table, that is the moment to loop in an immigration attorney, before the plane, not after.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "The urge to go home to Korea when a marriage is coming apart is completely understandable, and sometimes it really is the right move. The problem is making it as a reaction instead of a decision. During a divorce, an impulsive departure, especially one involving the children, can hand the other side a genuine advantage in court, and for a green card holder it can put status at risk at the same time. Slow down long enough to talk it through. The move may still be the right one; it will just be a far safer one.",
          "That is the kind of crossroads we help Korean-American families think through, we work with the Korean community in Korean, and we bring in immigration counsel when the two sides of this collide.",
        ],
      },
    ],
    sources: [
      { label: "New Jersey Statutes 9:2-2 - removal of children of divorced or separated parents from the state requires the consent of both parents or a court order", url: "https://law.justia.com/codes/new-jersey/title-9/section-9-2-2/" },
      { label: "New York Domestic Relations Law 240 - custody and parenting determined by the best interests of the child (governs relocation)", url: "https://www.nysenate.gov/legislation/laws/DOM/240" },
      { label: "U.S. Department of State - International Parental Child Abduction: South Korea (Hague Convention country information)", url: "https://travel.state.gov/content/travel/en/International-Parental-Child-Abduction/International-Parental-Child-Abduction-Country-Information/KoreaRepublicof.html" },
      { label: "USCIS - International Travel as a Permanent Resident (abandonment of residence, reentry permit)", url: "https://www.uscis.gov/green-card/after-we-grant-your-green-card/international-travel-as-a-permanent-resident" },
      { label: "U.S. Department of State - Returning Resident (SB-1) Visas", url: "https://travel.state.gov/content/travel/en/us-visas/immigrate/returning-resident.html" },
    ],
  },
  {
    slug: "e2-visa-korean-business-owners-green-card-aging-out",
    title: "The E-2 visa built your American life. Here are the two things it quietly won't do.",
    date: "July 19, 2026",
    description:
      "For Korean business-owner families on an E-2 visa: it renews forever but never becomes a green card, and your children age out at 21 with no Child Status Protection Act coverage. What the E-2 does not do, and the real paths to permanent residence.",
    sections: [
      {
        paragraphs: [
          "For a huge number of Korean families, the E-2 treaty investor visa is the reason they are here at all. You invested in a business, a dry cleaner, a deli, a restaurant, a franchise, and the E-2 let you come run it. It works beautifully, and it can keep working for a very long time. Which is exactly why so few people look closely at the two things it does not do, until the day those two things matter. This is not a reason to panic. It is a reason to plan earlier than you think you need to.",
          "This is general information, not legal advice. Immigration cases turn on specific facts and should be reviewed by a lawyer.",
        ],
      },
      {
        heading: "The E-2 renews forever, but it never becomes a green card",
        paragraphs: [
          "Here is the good news, and the trap hiding inside it. The E-2 can be extended over and over, in two-year increments, with no limit on the number of extensions, for as long as your business keeps qualifying. Families live on it for a decade, two decades, longer.",
          "But the E-2 is a temporary, nonimmigrant visa. As a condition of holding it, you are required to intend to leave the United States when the status ends. And no matter how many years you stack up, the E-2 by itself never converts into permanent residence. There is no built-in bridge from E-2 to a green card the way some work visas quietly allow. Getting a green card means stepping onto an entirely separate track, a deliberate, planned move, not something the E-2 turns into on its own if you just wait long enough.",
        ],
      },
      {
        heading: "Your business is your visa, if the business goes, so can your status",
        paragraphs: [
          "The second thing to understand is that the E-2 is tied to the enterprise. It exists because the business exists and qualifies. If the business closes, is sold, shrinks to the point where it is considered marginal, or otherwise stops meeting the requirements, the visa can end, and not just for you, but for your whole family riding on your status. For an E-2 family, business risk and immigration risk are the same risk. That is worth remembering before a slow year becomes a status problem.",
        ],
      },
      {
        heading: "The clock your children do not see coming: aging out at 21",
        paragraphs: [
          "This is the part that blindsides families, and it is the one we most want you to see early.",
          "Your spouse and your unmarried children under 21 hold E-2 status through you. Your spouse can work. Your children can go to school, though, worth noting, they cannot legally work on E-2 status even before they turn 21. And then comes the birthday nobody circled on the calendar. The day a child turns 21, they age out. They no longer qualify as your dependent, and their E-2 status through you ends.",
          "Parents often assume there is a safety net here, because they have heard of one, the Child Status Protection Act, which keeps some children from aging out at 21. But that protection applies to green card cases, not to nonimmigrant visas. It does not cover E-2 children. So a young person who was raised here, who went through American schools, who thinks of this country as home, can turn 21 and suddenly have no status through the parent who built the family's whole life here. Their choices at that point are to find their own footing, most often switching to a student visa, if they can, or to leave. It is one of the most painful conversations we have, and almost always it could have been eased by starting years earlier.",
        ],
      },
      {
        heading: "The paths that do lead to a green card",
        paragraphs: [
          "Now the genuinely hopeful part: real routes to permanent residence exist. They are simply separate from the E-2, and they reward planning ahead.",
          "The ones we see most often for E-2 families are the EB-5 immigrant investor green card, which involves a larger investment but leads directly to permanent residence; an employment-based green card, whether through your own business (for certain executives and managers) or another employer; and family-based options, such as marriage to a U.S. citizen, or being sponsored by your own child once that child becomes a U.S. citizen at 21. Because the E-2 is a depart-when-it-ends visa, moving toward any of these has to be done thoughtfully, with attention to the intent rules, it is not automatic, and it is not something to improvise at the last minute.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "The E-2 is an excellent tool. It is also a chapter, not the whole book. The families who do best treat it that way: they start mapping the green-card question, and their children's twenty-first-birthday question, years before either one becomes urgent, while every option is still open. If you are building a life in this country on an E-2, the most valuable thing you can do is find out where the exits are before you need one.",
          "That is exactly the kind of long-view planning we do with Korean-American families, and we work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "USCIS - E-2 Treaty Investors (period of stay, unlimited extensions, intent to depart, dependents, spouse work authorization)", url: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-2-treaty-investors" },
      { label: "U.S. Department of State - Treaty Trader (E-1) and Treaty Investor (E-2) Visas (nonimmigrant status, intent to depart, family members under 21)", url: "https://travel.state.gov/content/travel/en/us-visas/employment/treaty-trader-investor-visa-e.html" },
      { label: "USCIS - Child Status Protection Act (CSPA) (covers green card categories; does not protect E-2 nonimmigrant children)", url: "https://www.uscis.gov/green-card/green-card-processes-and-procedures/child-status-protection-act-cspa" },
      { label: "USCIS - EB-5 Immigrant Investor Program", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program" },
      { label: "USCIS - Green Card for Employment-Based Immigrants", url: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-employment-based-immigrants" },
    ],
  },
  {
    slug: "korean-foreign-gift-inheritance-irs-3520",
    title: "A gift or inheritance from Korea usually isn't taxed. The form you forget to file can still cost you 25%.",
    date: "July 19, 2026",
    description:
      "For Korean-American families: money or property from family in Korea is generally not taxed, but receiving more than $100,000 triggers IRS Form 3520, and missing it can mean a penalty of up to 25% of the gift, plus a possible FBAR and Form 8938 cascade.",
    sections: [
      {
        paragraphs: [
          "Here is a scenario we see all the time in the Korean community. Your parents in Korea wire you money toward a house down payment. A grandparent passes away and leaves you an inheritance. Your family sells an apartment in Seoul and sends you your share. In almost every one of these cases, the good news is real: you generally owe no U.S. income tax on money or property you receive as a gift or inheritance from family abroad. So people breathe a sigh of relief and move on. That relief is exactly where the trap is.",
          "This is general information, not tax or legal advice. Cross-border gift and inheritance reporting is technical and fact-specific, and it should be reviewed by a qualified cross-border tax professional. Our role is to help you spot the issue early and get you to the right person before a deadline turns into a penalty.",
        ],
      },
      {
        heading: "First, the good news: the gift itself usually is not taxed",
        paragraphs: [
          "The IRS is clear that a foreign gift is not income to you. In its own words, a foreign gift is not subject to income tax. If your parents, who live in Korea and are not U.S. taxpayers, give you money, you do not report it as income and you do not pay income tax on it. The same is generally true of an inheritance from a family member abroad. The money is yours to keep.",
          "So far, so good. The problem is not a tax. The problem is a form.",
        ],
      },
      {
        heading: "The catch: over $100,000, you have to report it",
        paragraphs: [
          "If you are a U.S. citizen or green card holder and you receive more than $100,000 in gifts or inheritances from a foreign individual or a foreign estate during the year, you must file IRS Form 3520 to report it. Form 3520 is an information return, not a tax return. You are not paying anything. You are simply telling the IRS that the money arrived.",
          "Two details catch people. First, the $100,000 is an aggregate figure for the whole year, so several smaller transfers that add up across the year count together. Second, the form is filed separately from your regular tax return, on its own schedule, which is exactly why it is so easy to miss even for people who dutifully file everything else. Gifts from a foreign company or partnership have a much lower reporting threshold, a little over $20,000, but the family scenarios we see almost always involve the $100,000 individual threshold.",
        ],
      },
      {
        heading: "Why the form matters so much: the penalty",
        paragraphs: [
          "Here is the part that stuns people. The penalty for failing to report a foreign gift on time is 5 percent of the gift for each month it goes unreported, up to a maximum of 25 percent of the gift. On a $300,000 inheritance, that ceiling is $75,000, on money you never owed a cent of tax on. It is one of the harshest penalties in the tax code precisely because it is attached to a form, not to a balance due.",
        ],
      },
      {
        heading: "Recent good news, but do not lean on it",
        paragraphs: [
          "There is a meaningful, recent development. In late 2024, after years of criticism, the IRS stopped automatically assessing this penalty on late-filed foreign-gift forms. It now reviews any reasonable-cause explanation you provide before deciding whether to impose a penalty at all, which is a real improvement. But read that carefully: the penalty still exists. If you have no good reason for filing late, up to 25 percent is still on the table. The change makes it easier to fix an honest mistake, not safe to ignore the rule.",
        ],
      },
      {
        heading: "It rarely stops at one form",
        paragraphs: [
          "There is one more layer worth knowing, because a single event often triggers several filings. If you park that gift or inheritance in a bank account in Korea, or you already keep accounts there, you may also have to file an FBAR, the foreign bank account report, once the total in your foreign accounts tops $10,000 at any point in the year. Depending on your situation, a separate form called Form 8938 can apply on top of that, with higher thresholds that start around $50,000. In other words, receiving family money from Korea and leaving it in a Korean account can quietly create three different reporting obligations at once, each with its own penalties.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "None of this is a tax on your family's generosity. It is reporting, and for most people it is straightforward when it is done on time. The danger is not knowing the obligation exists until the IRS raises it, when the numbers can get ugly fast. If money or property has come to you from family in Korea, or is about to, it is worth a short conversation to map out what has to be reported and by when.",
          "That is where we come in. We help Korean-American families see these cross-border issues coming and connect them with the right tax professionals before a form becomes a penalty. We work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "IRS - Gifts from a Foreign Person (Form 3520 reporting threshold; foreign gifts not subject to income tax; penalty)", url: "https://www.irs.gov/businesses/gifts-from-foreign-person" },
      { label: "IRS - Instructions for Form 3520", url: "https://www.irs.gov/instructions/i3520" },
      { label: "IRS Taxpayer Advocate - IRS ends automatic assessment of certain late foreign-gift/inheritance filing penalties (October 2024)", url: "https://www.taxpayeradvocate.irs.gov/news/nta-blog/irs-hears-concerns-from-tas-and-practitioners-makes-favorable-changes-to-foreign-gifts-and-inheritance-filing-penalties/2024/10/" },
      { label: "IRS - Report of Foreign Bank and Financial Accounts (FBAR)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/report-of-foreign-bank-and-financial-accounts-fbar" },
      { label: "IRS - Comparison of Form 8938 and FBAR Requirements", url: "https://www.irs.gov/businesses/comparison-of-form-8938-and-fbar-requirements" },
    ],
  },
  {
    slug: "orders-of-protection-immigration-nj-ny",
    title: "Orders of protection and your immigration status: what every noncitizen should understand",
    date: "July 19, 2026",
    description:
      "For noncitizens in New Jersey and New York: how an order of protection can reach your immigration status, why violating one is a deportation ground, and how New Jersey's permanent restraining orders differ sharply from New York's time-limited ones.",
    sections: [
      {
        paragraphs: [
          "Domestic violence is serious, and orders of protection, also called restraining orders, exist to keep people safe. But if you are not a U.S. citizen, an order of protection can reach into your immigration status in ways that are easy to underestimate. Two things you might assume go together actually do not: how long an order lasts, and what it means for your immigration future. Both depend heavily on which state and which court you are in. Here is a plain-language map, with New Jersey and New York kept separate, because most people just need to know what happens in their own state.",
          "This is general information, not legal advice. Domestic violence cases and their immigration consequences turn on specific facts and should be reviewed by a lawyer. If you are in immediate danger, call 911. For confidential support, the National Domestic Violence Hotline is 1-800-799-7233.",
        ],
      },
      {
        heading: "First, the federal rule that applies no matter where you live",
        paragraphs: [
          "Immigration law is federal, so this part is the same in New Jersey and New York.",
          "Simply having a civil order of protection entered against you is not, by itself, an automatic ground of deportation. But two closely related things are among the most serious in all of immigration law. First, if a court later finds that you violated a protection order, specifically the part that protects against credible threats of violence, repeated harassment, or bodily injury, that finding alone can make you deportable under INA section 237(a)(2)(E)(ii). This applies to temporary orders as well as final ones, it applies whether or not you are criminally prosecuted for the violation, and it can apply even when the violation itself involved no violence at all: a text message, a phone call, showing up somewhere you were told to stay away from. Second, a criminal conviction for a crime of domestic violence, stalking, or child abuse is its own separate ground of deportability.",
          "And even short of removal, an order of protection is entered into law-enforcement databases, including the national NCIC system, that surface in immigration background checks. That can affect bond, an application for a green card or citizenship, and your ability to reenter the country after traveling abroad. In short, the order by itself may not remove you, but it lays a tripwire, and stepping on it can.",
        ],
      },
      {
        heading: "New Jersey: the order can last the rest of your life",
        paragraphs: [
          "New Jersey is unusually severe here, and most people do not realize it until it is too late.",
          "A New Jersey Final Restraining Order does not expire. There is no end date. It can last the rest of your life. The person it is entered against is also placed in New Jersey's Domestic Violence Central Registry, a statewide database maintained by the courts and available to law enforcement and to agencies running background checks, and, like the order itself, that entry does not simply age off with time.",
          "Undoing a Final Restraining Order is not a matter of waiting it out, either. It requires going back to court and convincing a judge under a demanding, multi-factor standard, and a request by the restrained person to dissolve the order is a heavy lift that courts do not grant lightly. Now put the immigration piece on top of that permanence, and the danger comes into focus: because a New Jersey Final Restraining Order never expires, the window in which a single violation could make you deportable is not two years, or five, it is the entire time you live in the state.",
        ],
      },
      {
        heading: "New York: finite everywhere, but the length varies a great deal",
        paragraphs: [
          "New York works differently, and one common belief about it is simply wrong: New York does not issue truly permanent, lifetime orders of protection. Every New York order has an end date. What changes dramatically is how far away that date is, depending on which court issued the order.",
          "A Family Court final order of protection generally lasts up to two years, or up to five years if the court finds aggravating circumstances such as physical injury, use of a dangerous instrument, or a history of violations. A Criminal Court order tied to a conviction can hang over you much longer, up to five years for a misdemeanor and up to eight years for a felony, measured from the end of the sentence. The Supreme Court can also issue an order of protection inside a divorce case, but that order, too, is time-limited rather than permanent. So the idea that a New York order, even one from Supreme Court, can run forever is not accurate. What is true is that a criminal order can shadow you for the better part of a decade.",
          "While any New York order is active, the same federal rule applies: a court finding that you violated it can make you deportable, exactly as in New Jersey. The difference is timing. In New York, the exposure eventually sunsets when the order expires; in New Jersey, it may not.",
        ],
      },
      {
        heading: "The other side: if you are the one seeking protection",
        paragraphs: [
          "This runs both ways, and for many people in our community it runs the other way entirely. If you are a noncitizen who has been abused, an order of protection is not a threat to your status, it can help it. The same abuse that supports a protective order can also support a VAWA self-petition or a U visa for victims of certain crimes, and both can lead to a green card independent of an abusive spouse. If that is your situation, the order is part of protecting you, not endangering you.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "When you are not a U.S. citizen, an order of protection is never only a family-court or criminal matter. It can quietly shape whether you keep your status, and New Jersey and New York hand you very different timelines for that risk: potentially lifelong in New Jersey, finite but sometimes years-long in New York. Whether an order has been entered against you or you are the one who needs protection, the family, criminal, and immigration sides all have to be looked at together, not one at a time.",
          "That is exactly the kind of case we look at from every angle at once, and we work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "Immigration and Nationality Act 237(a)(2)(E) (8 U.S.C. 1227(a)(2)(E)) - deportability for crimes of domestic violence, stalking, child abuse, and violation of a protection order", url: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title8-section1227" },
      { label: "New Jersey Statutes 2C:25-29 - Final Restraining Order (Prevention of Domestic Violence Act)", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-25-29/" },
      { label: "New Jersey Statutes 2C:25-34 - Domestic Violence Central Registry", url: "https://law.justia.com/codes/new-jersey/title-2c/section-2c-25-34/" },
      { label: "New Jersey Courts - Domestic Violence (restraining orders, self-help)", url: "https://www.njcourts.gov/self-help/domestic-violence" },
      { label: "New York Family Court Act 842 - duration of an order of protection", url: "https://www.nysenate.gov/legislation/laws/FCT/842" },
      { label: "New York Criminal Procedure Law 530.12 - orders of protection in criminal cases (durations)", url: "https://www.nysenate.gov/legislation/laws/CPL/530.12" },
      { label: "New York State Office for the Prevention of Domestic Violence - Orders of Protection", url: "https://opdv.ny.gov/orders-protection" },
      { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org/" },
    ],
  },
  {
    slug: "korean-vs-american-divorce-mindsets",
    title: "Korean divorce instincts that do not apply in an American court",
    date: "July 19, 2026",
    description:
      "A general comparison for the Korean-American community: the Korean divorce instincts that do not translate to a U.S. court, from no-fault divorce and fault not moving the money, to consolation money, alimony, child-support guidelines, and the judicial discretion that drives every case.",
    sections: [
      {
        paragraphs: [
          "A quick, honest caveat before anything else. This is a big-picture comparison based on general impressions, not a rule book. Divorce in the United States is governed by state law, and it varies enormously, not just from state to state, but county to county, and honestly courtroom to courtroom. Each place has its own flavor. The real answer to what will happen in my divorce truly depends on where you live and who is deciding your case. So take what follows as a map of the mindset gaps we see most often in the Korean community, the instincts people carry over from Korea that do not translate here, and then talk to a lawyer licensed where you actually live.",
        ],
      },
      {
        heading: "You do not need your spouse's consent to get divorced",
        paragraphs: [
          "In the United States, every state allows some form of no-fault divorce. That means one spouse can end the marriage without the other's agreement and without proving that anyone did anything wrong. In Korea, the instinct is different: if your spouse will not agree to a mutual divorce, you generally have to prove a statutory ground under the Civil Act, adultery, desertion, serious mistreatment, and the like, to get a judicial divorce. That I need grounds, or I need their consent reflex does not apply here.",
          "The corollary matters just as much: you do not need to manufacture or provoke a situation, an affair, a blowup, a police call, to qualify for a divorce. You never have to, and you should not. It does not unlock the door. The door is already open.",
        ],
      },
      {
        heading: "Proving your spouse was the bad one usually does not get you more money",
        paragraphs: [
          "This is the big one, and the one that costs people the most when they get it wrong. In most U.S. states, marital fault, who cheated, who walked out, generally has little to no effect on how property is divided. Property division is about splitting the marital estate fairly, not about punishing bad behavior. In my experience the main place fault actually moves the needle is serious domestic violence, and even then courts tend to reserve it for the severe cases, for example, abuse bad enough that you had to flee to another state. Ordinary marital wrongdoing is usually not the lever people hope it is.",
          "It is worth naming a related instinct: needing more money, say, to raise the children, is not by itself a reason a court hands you a bigger share of the property. Children's needs are addressed through child support, which is its own calculation, not by tilting the property division. A judge can move within the discretion the law gives them, but I need it more is not a rule that redistributes assets.",
          "Contrast that with Korea, where fault sits at the center. There, the spouse mainly responsible for the breakup can be ordered to pay wisaryo (위자료), consolation money for the emotional harm, often a meaningful sum. In most of the United States there is simply no consolation money payday for a betrayal. Building an entire case around proving your spouse was the villain frequently does nothing but run up your legal bill.",
        ],
      },
      {
        heading: "In Korea the guilty spouse often cannot force a divorce. In America, anyone can.",
        paragraphs: [
          "Korean courts have long held, and the Supreme Court reaffirmed this in 2015, that the spouse primarily at fault for a marriage breaking down generally cannot obtain a divorce over the other spouse's objection. So Korean intuition often runs: my spouse cheated, so they cannot divorce me, or I am the one at fault, so I am stuck. In the American no-fault system, that is simply not how it works. Either spouse can end the marriage regardless of who is to blame. Being the wronged party does not give you a veto, and being the one who wants out does not require clean hands.",
        ],
      },
      {
        heading: "America has ongoing alimony. Korea mostly does not.",
        paragraphs: [
          "In Korea, the money side of a divorce is typically settled in one shot: property division plus, where fault applies, a lump-sum consolation payment. Ongoing support is reserved for exceptional situations. Many U.S. states work very differently. They have spousal support, also called maintenance or alimony, that one spouse pays the other, sometimes monthly, sometimes for years. Korean clients are often genuinely surprised that an American divorce can create a long-running monthly obligation, in either direction. Whether there is any support at all, how much, and for how long depends heavily on your state and your judge.",
          "One correction to a common assumption: neither New York nor New Jersey uses a minimum marriage length as an on-off switch for alimony. In New York, the amount of maintenance is set by a statutory formula, up to a payor-income cap that rose to $241,000 on March 1, 2026, with the court using its discretion on income above that cap. What is advisory, not fixed, is how long it lasts. As a rough guide, a marriage up to fifteen years points to support for a period equal to 15 to 30 percent of the length of the marriage; more than fifteen and up to twenty years, 30 to 40 percent; and more than twenty years, 35 to 50 percent. A five-year marriage, then, tends to produce closer to a year of support than a decade, modest, but not nothing. New York's real dividing lines sit at fifteen and twenty years, not at seven or eight.",
          "New Jersey leans on judgment more than formula, no calculator, just a set of statutory factors a judge weighs, but it too turns on length. For a marriage of less than twenty years, alimony generally cannot last longer than the marriage itself, absent exceptional circumstances, and open-ended (open durational) alimony is generally reserved for longer marriages, typically twenty years and up. So a six-year marriage does not presumptively get nothing; it gets a ceiling of about six years. This is exactly where a spouse who set aside a career matters: giving up a career or a career opportunity to support the household is one of the statutory factors, and a recognized exceptional circumstance, a court can weigh. In practice, awards from short marriages tend to be modest and time-limited. But modest is not none, and a spouse who genuinely sacrificed earning power can do considerably better.",
          "Child support runs on a guideline formula in both states, up to a combined-income cap of $193,000 in New York and $187,200 in New Jersey as of 2026, with the court's discretion taking over on income above the cap. Notice the pattern: in New York, maintenance and child support share the same architecture, a formula up to a ceiling, discretion beyond it. The real variable in alimony is not whether a formula exists, but how long the support runs.",
        ],
      },
      {
        heading: "The judge's discretion runs almost everything",
        paragraphs: [
          "If you remember one thing, remember this. American divorce statutes mostly hand judges ranges and lists of factors, not fixed answers. Two families with nearly identical facts can end up in different places because a judge weighed the factors differently. That downstream discretion shapes essentially every matrimonial case. It is also why what happened to my friend and what I read online are such poor predictors of your own outcome, and why the judge you draw, the county you are in, and the local legal culture can matter as much as the black-letter rule.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "If your sense of how divorce works was shaped in Korea, some of those instincts will serve you poorly here, and a few could genuinely cost you, usually by pushing people to fight the wrong battle. The two systems are asking different questions. We help Korean-American families translate between them and understand how it actually works where they live. We work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "Library of Congress, Global Legal Monitor - South Korea: Supreme Court Keeps Unfaithful Spouses from Being Able to File for Divorce (2015)", url: "https://www.loc.gov/item/global-legal-monitor/2015-10-13/south-korea-supreme-court-keeps-unfaithful-spouses-from-being-able-to-file-for-divorce/" },
      { label: "Korea Legislation Research Institute - Civil Act (English; judicial-divorce grounds Art. 840, property division Art. 839-2, consolation money)", url: "https://elaw.klri.re.kr/" },
      { label: "New York Courts - Divorce (state-law overview and self-help)", url: "https://www.nycourts.gov/divorce/" },
      { label: "New York State - Child Support Standards Chart (combined parental income cap $193,000, eff. March 1, 2026)", url: "https://childsupport.ny.gov/pdfs/CSSA.pdf" },
      { label: "New York Courts - Maintenance and child support legislation and income caps ($241,000 maintenance, eff. March 1, 2026)", url: "https://ww2.nycourts.gov/divorce/legislationandcourtrules.shtml" },
      { label: "New York Domestic Relations Law 236(B) - post-divorce maintenance (amount formula, income cap, advisory duration schedule)", url: "https://www.nysenate.gov/legislation/laws/DOM/236" },
      { label: "New Jersey Courts - Divorce (state-law overview and self-help)", url: "https://www.njcourts.gov/self-help/divorce" },
      { label: "New Jersey alimony statute, N.J.S.A. 2A:34-23 (statutory factors; duration limits for marriages under 20 years; exceptional circumstances)", url: "https://law.justia.com/codes/new-jersey/title-2a/section-2a-34-23/" },
      { label: "New Jersey Courts - Child Support Guidelines (Appendix IX; combined net income cap $187,200/year)", url: "https://www.njcourts.gov/self-help/family/child-support" },
    ],
  },
  {
    slug: "korean-military-service-dual-national-sons",
    title: "Your American-born son may also be a Korean citizen, and there is a deadline you do not want to miss.",
    date: "July 19, 2026",
    description:
      "Many Korean-American parents do not realize their U.S.-born son is also a Korean citizen from birth, or that a deadline around his 18th birthday decides whether he can renounce Korean nationality or is treated as owing military service. What every family with sons should know.",
    sections: [
      {
        paragraphs: [
          "Many Korean-American parents are surprised to learn that their U.S.-born son is, under Korean law, also a Korean citizen, from the day he was born, whether or not anyone ever registered him in Korea. And with that citizenship can come an obligation most families never see coming: mandatory military service. There is a quiet deadline, tied to your son's 18th birthday, that can decide whether he keeps an easy choice or loses it for the better part of two decades. This is not meant to frighten you. It is one of the most common and most avoidable surprises we see in the Korean community, if you know about it in time.",
          "This is general information, not legal advice. Korean nationality and military-service rules are set by the Korean government and can change; the specifics for your family should be confirmed with the Korean consulate and with counsel.",
        ],
      },
      {
        heading: "Your son may be a Korean citizen without anyone ever signing him up",
        paragraphs: [
          "Korean nationality passes by bloodline, not by birthplace. Under Korean law, a child born to at least one Korean-national parent generally acquires Korean nationality automatically at birth, even if the child is born in the United States, holds a U.S. passport, and has never set foot in Korea. No application is required for it to happen, which is exactly why so many families do not realize it has happened. A son can be a dual citizen for years without anyone in the family thinking of him that way.",
        ],
      },
      {
        heading: "Why it matters: military service",
        paragraphs: [
          "Korea has mandatory military service for its male citizens. The obligation generally attaches around age 18 and can extend into a man's mid-to-late thirties until it is satisfied or formally resolved. For a young man who is a dual citizen, being a U.S. citizen who grew up in America does not, by itself, remove him from that system. In the eyes of Korean law, he is a Korean man of military-service age like any other.",
        ],
      },
      {
        heading: "The deadline that changes everything",
        paragraphs: [
          "Here is the date to write down. To step out of the military-service obligation cleanly, a male dual citizen generally must file a declaration renouncing his Korean nationality, in Korean gukjeok-ital (국적이탈), by March 31 of the year he turns 18. Filed in that window, the choice is straightforward. This single deadline is the most important thing in this entire article.",
        ],
      },
      {
        heading: "What happens if the deadline passes",
        paragraphs: [
          "If that window closes without a renunciation on file, the door does not simply reopen later. As a general rule, once the deadline passes, a male dual citizen cannot renounce his Korean nationality until he has completed his military service or been formally exempted from it, which can mean being unable to make that choice until his mid-to-late thirties. A decision that could have been made with a single filing at 17 or 18 can become something he cannot revisit for nearly twenty years.",
        ],
      },
      {
        heading: "The real-world risk: a trip to Korea",
        paragraphs: [
          "For most families, this stops being abstract at the airport in Seoul. Young men who never knew they were Korean citizens have arrived in Korea to visit grandparents or attend a family event and found themselves treated as citizens who owe military service, sometimes because they were long ago listed on a Korean family register without their knowledge. What was supposed to be a two-week visit can turn into a serious, stressful problem. If there is any chance your son is a dual citizen and he is anywhere near military-service age, his travel to Korea deserves a careful look before he books the ticket.",
        ],
      },
      {
        heading: "The good news: with time, this is manageable",
        paragraphs: [
          "Almost none of this is a crisis if you see it coming. When a family understands early that a son is a dual citizen, there is time to make an informed, unhurried decision before the deadline rather than after. The renunciation itself is handled through the Korean consulate, and in narrow circumstances there are limited exceptions for those who missed the deadline, but those are the exception, not the plan. The plan is to know where your family stands well before your son's 18th birthday.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "If you are a Korean-American parent with a son, especially a son approaching his teens, it is worth finding out now whether Korean law considers him a citizen, and what that means for his choices and his travel. The families who get ahead of this keep every option open. The ones who learn about it too late are often left with none.",
          "We help Korean-American families understand where they stand on questions exactly like this, and coordinate the right next steps before a deadline decides for them. We work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "Republic of Korea, Ministry of Foreign Affairs - Nationality / Renunciation of Korean Nationality (consular guidance for multiple nationals)", url: "https://overseas.mofa.go.kr/us-en/brd/m_4503/view.do?seq=713549" },
      { label: "Republic of Korea, Military Manpower Administration (MMA) - military service obligation and overseas Koreans (English)", url: "https://www.mma.go.kr/eng/" },
      { label: "Republic of Korea, Ministry of Justice / Hi Korea - nationality and immigration information", url: "https://www.hikorea.go.kr/" },
      { label: "U.S. Department of State - Dual Nationality", url: "https://travel.state.gov/content/travel/en/legal/travel-legal-considerations/Advice-about-Possible-Loss-of-US-Nationality-Dual-Nationality/Dual-Nationality.html" },
    ],
  },
  {
    slug: "criminal-charge-green-card-risk",
    title: "A criminal charge can put your green card at risk. Here is what to know.",
    date: "July 19, 2026",
    description:
      "For noncitizens in New York and New Jersey: how a criminal charge can threaten a green card or visa, why the felony-or-misdemeanor label does not control, what a crime involving moral turpitude and an aggravated felony mean, and why Padilla v. Kentucky made this a constitutional issue.",
    sections: [
      {
        paragraphs: [
          "If you are not a U.S. citizen and you have been arrested or charged with a crime, understand this before anything else: your criminal case and your immigration status run on two different systems. A result that looks like a win in criminal court can quietly put your green card or visa in danger. People are often told to take a quick plea to make it go away, and for a noncitizen, that quick plea is sometimes the very thing that starts a deportation case years later.",
          "This is general information, not legal advice. Whether a specific charge carries immigration consequences depends on the exact offense and your history, and it should be reviewed by a lawyer.",
        ],
      },
      {
        heading: "Two different systems",
        paragraphs: [
          "The criminal court cares about guilt, sentencing, and penalties under state law. Immigration law asks a separate question entirely: does this conviction make you inadmissible or deportable under federal law? The same guilty plea can be minor in one system and life-changing in the other, and nothing about a plea in criminal court announces the immigration consequence. You have to look for it.",
        ],
      },
      {
        heading: "Forget felony versus misdemeanor",
        paragraphs: [
          "This is the part that surprises people most. Whether your state calls the offense a felony or a misdemeanor is, for immigration purposes, largely beside the point. The U.S. Department of State's own guidance says it directly: the felony-or-misdemeanor label under state law is irrelevant to the immigration analysis. A state misdemeanor can be enough to make you inadmissible or deportable, while some offenses that sound serious may not carry the same weight. The comfort people take from the word misdemeanor is often false comfort.",
        ],
      },
      {
        heading: "A crime involving moral turpitude",
        paragraphs: [
          "The category that catches the most people is the crime involving moral turpitude, or CIMT, conduct the law treats as inherently base, vile, or depraved, which in practice means offenses involving fraud or deceit, theft, or an intent to harm. A single such conviction can be enough to make a green card holder inadmissible or deportable. It does not turn on how minor the case looked in criminal court; it turns on the nature of the offense itself. A narrow petty offense exception can sometimes help where there is only one such offense with a short maximum penalty and a short sentence, but it is narrow, and whether it fits is a question for a lawyer.",
        ],
      },
      {
        heading: "The most serious category: aggravated felonies",
        paragraphs: [
          "A second category carries the harshest consequences: the aggravated felony. The name misleads in two directions. The offense does not have to be violent, and it does not even have to be a felony under your state's law. When a conviction falls here, the consequences are close to automatic: deportable, barred from most forms of relief, and often detained without bond. This is the ground that most often turns a criminal case into a one-way ticket out of the country.",
        ],
      },
      {
        heading: "It can surface years later, even at the airport",
        paragraphs: [
          "These consequences are not always immediate. A conviction can resurface when you renew or replace status, when you apply to naturalize, or when you return from a trip abroad. A green card holder coming home from visiting family can, with certain convictions, be treated as seeking admission all over again at the airport, and found inadmissible on the spot. A plea entered and forgotten years ago can come back at the worst possible moment.",
        ],
      },
      {
        heading: "Why the Supreme Court made this constitutional: Padilla v. Kentucky",
        paragraphs: [
          "The stakes are high enough that the U.S. Supreme Court has held immigration consequences are not an optional footnote to a criminal case. In Padilla v. Kentucky, 559 U.S. 356 (2010), the Court ruled that the Sixth Amendment right to effective counsel requires a criminal defense attorney to advise a noncitizen client whether a guilty plea carries a risk of deportation. Jose Padilla was a lawful permanent resident, and a Vietnam War veteran, who pleaded guilty to a marijuana charge after his lawyer wrongly told him it would not affect his status. It did; his deportation became virtually mandatory. Being warned about the immigration consequence of a plea, the Court made clear, is not a courtesy. It is a constitutional requirement.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "For a noncitizen, a criminal charge is never only a criminal matter. The two sides have to be weighed together, before the case is resolved, not after.",
          "If you are facing a charge and you are not a U.S. citizen, talk to us before you decide anything. We look at both the criminal and the immigration side together, and we work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "Padilla v. Kentucky, 559 U.S. 356 (2010) - U.S. Supreme Court opinion", url: "https://supreme.justia.com/cases/federal/us/559/356/" },
      { label: "U.S. Dept. of State, 9 FAM 302.3 - Ineligibility Based on Criminal Activity (INA 212(a)(2)); CIMT and the petty offense exception", url: "https://fam.state.gov/fam/09FAM/09FAM030203.html" },
      { label: "INA 212(a)(2) - inadmissibility on criminal grounds (8 U.S.C. 1182(a)(2))", url: "https://www.uscis.gov/laws-and-policy/legislation/immigration-and-nationality-act" },
      { label: "INA 237(a)(2) - deportability on criminal grounds (8 U.S.C. 1227(a)(2))", url: "https://www.uscis.gov/laws-and-policy/legislation/immigration-and-nationality-act" },
      { label: "INA 101(a)(43) - definition of aggravated felony (8 U.S.C. 1101(a)(43))", url: "https://www.uscis.gov/laws-and-policy/legislation/immigration-and-nationality-act" },
      { label: "Congressional Research Service, Immigration Consequences of Criminal Activity (R45151)", url: "https://www.congress.gov/crs-product/R45151" },
    ],
  },
  {
    slug: "spouse-wont-sponsor-green-card",
    title: "My spouse will no longer sponsor me for my green card. What should I do?",
    date: "July 19, 2026",
    description:
      "What to do when a spouse steps back from your marriage-based green card: timelines, the good-faith marriage standard, I-751 waivers, VAWA, and other paths through employment or the military.",
    sections: [
      {
        paragraphs: [
          "If your marriage-based green card case has stalled because your spouse no longer wants to sponsor you, take a breath. This is one of the most common situations we see, and in many cases there is still a path forward. What happens next depends on where you are in the process and on the facts of your marriage. Below is a plain-language overview of the questions people ask us most, so you have a clearer idea of what to do next.",
        ],
      },
      {
        heading: "How long does it take to get the green card?",
        paragraphs: [
          "This is the question we hear most, and the honest answer is: it depends on two things.",
          "First, who is sponsoring you. If your spouse is a U.S. citizen, you are considered an immediate relative. There is no annual limit on those green cards, so your wait is mostly about processing time rather than waiting for a visa to become available. If your spouse is a green card holder (a lawful permanent resident), you fall into a family preference category, which can involve an additional wait for a visa number. The U.S. Department of State publishes that availability each month in the Visa Bulletin.",
          "Second, where you are. If you are already in the United States, you generally apply to adjust status without leaving. If you are abroad, you go through consular processing at a U.S. embassy or consulate. The two tracks move at different speeds.",
          "Because processing times change constantly, we do not quote a fixed number of months. USCIS publishes current, case-by-case processing times through its online processing-times tool, and that, together with the Visa Bulletin, is the most reliable place to check where things actually stand.",
          "One more thing worth knowing up front: if you have been married less than two years when your green card is approved, you receive a two-year conditional green card rather than the standard ten-year card. Before it expires, you have to file a separate petition (Form I-751) to remove those conditions. That timing detail matters a great deal for the questions below.",
        ],
      },
      {
        heading: "What happens if my spouse no longer wants to sponsor me?",
        paragraphs: [
          "This is where it gets tricky, and where the stage of your case really matters.",
          "Your spouse plays two roles. They are the petitioner who filed the Form I-130 that starts the case, and they are usually your financial sponsor on the Form I-864 affidavit of support. A spouse who no longer wants to sponsor you may be stepping back from one or both of these.",
          "As a general rule, the petitioning spouse can withdraw the I-130 in writing up until the point you are granted permanent residence. If they withdraw it before it is approved, the case usually cannot move forward on that petition. How much this affects you depends on how far along you are, for example, whether your interview has already happened, whether the petition is still pending or has been approved, and whether you have already been granted conditional residence. The further along and the more that has been established, the more options tend to be on the table.",
          "Through all of this, one standard sits at the center: whether your marriage was entered into in good faith, meaning you married for a real relationship, not to get around immigration law. A marriage that was genuine when it began does not stop being genuine just because it later runs into trouble. That good-faith question is the thing to be ready to document, whatever your spouse decides to do.",
        ],
      },
      {
        heading: "Do I have to stay in this relationship to keep my case alive?",
        paragraphs: [
          "Not necessarily, and you should never feel that your immigration status forces you to stay somewhere unsafe.",
          "If you already have a two-year conditional green card, the law anticipates that some marriages end. Normally you and your spouse file the I-751 together to remove the conditions. But USCIS allows you to file for a waiver of that joint-filing requirement in several situations, including when you entered the marriage in good faith but it later ended in divorce or annulment; when you entered the marriage in good faith but you or your child were battered or subjected to extreme cruelty by your spouse; or when being removed from the United States would cause extreme hardship. In each case, you still show that the marriage was real.",
          "It helps to clear up a point that surprises many people. Good faith is about your intent at the beginning, whether you married to build a real life together, not about how the marriage turned out. In family law, an annulment is often described as treating the marriage as if it never existed. But immigration does not measure good faith by whether the marriage stayed legally valid; it looks at what you intended when you married. That is why a marriage entered in good faith can still support a waiver even if it later ends in annulment rather than divorce: the annulment describes how the marriage ended, while good faith describes why you entered it. Unusual situations, such as a marriage that may never have been legally valid to begin with, can raise separate questions and are worth reviewing with an attorney.",
        ],
      },
      {
        heading: "If there is domestic violence, act now",
        paragraphs: [
          "If there is abuse in your relationship, please treat this as urgent. You do not have to stay, and you do not have to depend on your abuser to pursue your status. Get a lawyer immediately.",
          "An experienced attorney can help you file a VAWA self-petition (Form I-360). The Violence Against Women Act lets a noncitizen who has been abused by a U.S. citizen or lawful permanent resident spouse petition for themselves, independently, and without the abuser's knowledge, consent, or participation. The process is confidential. It is available to spouses of any gender, and an approved petition can lead to a green card and to work authorization. You still show that the marriage was entered in good faith.",
          "If you are in immediate danger, call 911. For confidential support any time, the National Domestic Violence Hotline is 1-800-799-7233 (SAFE).",
        ],
      },
      {
        heading: "How else can I get a green card?",
        paragraphs: [
          "Marriage is only one door. The most common alternative we see is a green card through an employer.",
          "In the employment-based system there are several categories: EB-1 for priority workers such as people with extraordinary ability, outstanding researchers, and certain executives; EB-2 for those with advanced degrees or exceptional ability; EB-3 for skilled workers, professionals, and other workers; EB-4 for certain special immigrants; and EB-5 for investors. Most employment cases start with an employer sponsoring you, and many EB-2 and EB-3 cases first require a labor certification (PERM) from the U.S. Department of Labor, followed by the employer's Form I-140 petition, and then either adjustment of status or an immigrant visa abroad.",
          "A few of these categories, such as EB-1 extraordinary ability and EB-2 through a national interest waiver, can allow a person to petition for themselves without an employer. Whether any employment path fits you depends on your education, work history, and field.",
        ],
      },
      {
        heading: "What about joining the U.S. military?",
        paragraphs: [
          "Military service is another route people ask about often, and it can lead to citizenship faster than the usual path, but there is an important detail to understand.",
          "For someone who already has a green card, one year of honorable service in peacetime can qualify you to apply for naturalization sooner than the usual timeline (under INA 328). And during designated periods of hostilities, service members can naturalize under INA 329, a provision generous enough that it does not require you to have been a permanent resident first, and it waives the usual continuous-residence and physical-presence requirements.",
          "The catch is at the front door: to enlist in the U.S. armed forces, you generally already need to be a U.S. citizen, a U.S. national, or a lawful permanent resident. So for most people, military service is a faster road to citizenship for someone who already holds a green card, rather than a way to obtain that first green card. There are also protections for the families of service members. If the military is something you are considering, talk to both a recruiter and an immigration attorney about how the two systems fit together.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "A spouse stepping back from your case is frightening, but it is rarely the end of the road. The key is to act early, before deadlines pass or status lapses, and to get advice specific to your situation. Preserve the family when it can be preserved. Protect the client when it cannot.",
          "If you would like to talk through where your case stands, we are here, and we work with the Korean community in Korean.",
        ],
      },
    ],
    sources: [
      { label: "USCIS - Conditional Permanent Residence", url: "https://www.uscis.gov/green-card/after-we-grant-your-green-card/conditional-permanent-residence" },
      { label: "USCIS - Removing Conditions on Permanent Residence Based on Marriage (I-751 waivers)", url: "https://www.uscis.gov/green-card/after-we-grant-your-green-card/conditional-permanent-residence/removing-conditions-on-permanent-residence-based-on-marriage" },
      { label: "USCIS - Form I-751, Petition to Remove Conditions on Residence", url: "https://www.uscis.gov/i-751" },
      { label: "USCIS - Form I-130, Petition for Alien Relative", url: "https://www.uscis.gov/i-130" },
      { label: "USCIS - Green Card for VAWA Self-Petitioner", url: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-vawa-self-petitioner" },
      { label: "USCIS - Abused Spouses, Children and Parents (VAWA)", url: "https://www.uscis.gov/humanitarian/abused-spouses-children-and-parents" },
      { label: "USCIS - Form I-360", url: "https://www.uscis.gov/i-360" },
      { label: "USCIS - Permanent Workers (employment-based categories)", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers" },
      { label: "USCIS - Green Card for Employment-Based Immigrants", url: "https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-employment-based-immigrants" },
      { label: "USCIS - Naturalization Through Military Service (INA 328 and 329)", url: "https://www.uscis.gov/military/naturalization-through-military-service" },
      { label: "USCIS - Check Case Processing Times", url: "https://egov.uscis.gov/processing-times/" },
      { label: "U.S. Department of State - Visa Bulletin", url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html" },
      { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org/" },
    ],
  },
  {
    slug: "biggest-asset-in-your-divorce",
    title: "What’s the Biggest Asset in Your Divorce? It’s Not the House.",
    date: "July 13, 2026",
    description:
      "Real families who let the kids keep the house while the parents rotate — what birdnesting looks like, what it honestly costs, and how it gets built in New York and New Jersey.",
    sections: [
      {
        paragraphs: [
          "Ask anyone heading into a divorce to name the biggest asset in the case and you will almost always get the same answer: the house. It is the biggest number on the balance sheet, so it becomes the biggest fight.",
          "The couples who handle divorce best figure out early that the balance sheet is lying to them. The most valuable asset in the case is not the house. It is the children — specifically, their stability. And once you account for it that way, some very unconventional decisions start to look like the most rational ones in the file.",
        ],
      },
      {
        heading: "The couple who acted on it",
        paragraphs: [
          "A divorced couple in Washington State — a photographer and a firefighter — went viral in a TODAY story last year for exactly this. Their two small children never moved. Same beds, same house, same street. It is the parents who rotate in and out on a schedule; she stays with her parents on off days, he often sleeps at the firehouse. The mother’s explanation: “I’m a product of divorce. I spent my life living out of a suitcase, and there was no way we could ask our kids to do the same.”",
          "The arrangement has a name — “birdnesting,” because the children stay in the nest. In practice it looks like this:",
        ],
        bullets: [
          "The children live in the family home full-time. Nothing about their world moves.",
          "The parents rotate in and out on a fixed schedule, like shifts.",
          "Off duty, each parent stays somewhere modest — a relative’s spare room, a shared apartment, a studio.",
          "Everything is in writing: the rotation, who pays which house expense, how long the arrangement runs, and when it gets reviewed.",
        ],
      },
      {
        paragraphs: [
          "They are not alone. A Virginia couple with five children told TODAY they run the same play on a written weekly rotation. One mother nested for more than six years and wrote a book about it. The Virginia mom gave the line that sums up the whole idea: “Kids should not have to be resilient when it’s about something that adults can change for them.”",
        ],
      },
      {
        heading: "The honest part",
        paragraphs: [
          "Nesting is not the enlightened default, and it fails in predictable ways. Before admiring it into your own settlement, know what it costs:",
        ],
        bullets: [
          "It demands more cooperation after the divorce than many couples had during the marriage — shared space, shared rules, joint house money.",
          "It usually costs more, not less. The adults still need somewhere to be on their off days.",
          "Most professionals treat it as a bridge measured in months, not years, while children absorb the news and the adults sort permanent housing. The six-year families are real, but they are disciplined exceptions.",
          "Children can misread it as reconciliation, so the message to them has to be clear and repeated.",
          "It is off the table where there is violence, fear, or a pattern of control. Full stop. Nesting assumes two safe parents; not every case has them.",
        ],
      },
      {
        heading: "How it gets built in New York and New Jersey",
        paragraphs: [
          "No statute in either state says “birdnesting.” It is built by agreement — a parenting plan or settlement term that spells out the rotation, the house expenses, what happens when circumstances change (new partners, new jobs, a sale), and a review date so nobody is trapped by inertia. Courts in both states measure parenting arrangements against the children’s best interests, and New Jersey’s statute now puts children’s safety and stability at the front of that analysis. A judge will rarely force nesting on parents who cannot cooperate, and will rarely stand in the way of parents who can.",
          "Nesting is not a legal trick, and it is not for everyone. It is what it looks like when two people who could not stay married decide to stay parents — and put it in writing. This office works by a simple rule: preserve the family when it can be preserved; protect the client when it cannot. Sometimes preserving the family means preserving the one address a childhood happens at, and being the kind of adults who take turns carrying the suitcase.",
        ],
      },
    ],
    sources: [
      { label: "TODAY: “What is birdnesting? This divorced couple’s custody arrangement is being called ‘genius’” (April 2025)", url: "https://www.today.com/parents/family/what-is-birdnesting-custody-arrangement-rcna200434" },
      { label: "TODAY: “Couple’s ‘selfless’ co-parenting strategy goes viral” — the Fowler family’s weekly nesting rotation (June 2025)", url: "https://www.today.com/parents/family/birdnesting-divorced-couple-co-parenting-rcna209960" },
      { label: "Beth Behrendt, Nesting After Divorce: Co-Parenting in the Family Home (Union Square & Co., 2023)", url: "https://www.hachettebookgroup.com/titles/beth-behrendt/nesting-after-divorce/9781454949800/" },
      { label: "NBC News: “‘Bird nesting’ gives kids one stable home after a divorce. Does it work?” (expert benefits and risks)", url: "https://www.nbcnews.com/better/health/birdnesting-gives-kids-one-stable-home-after-divorce-does-it-ncna935336" },
      { label: "P.L.2025, c.316 — New Jersey’s amended custody statute (child safety as a threshold issue)", url: "https://pub.njleg.gov/Bills/2024/PL25/316_.PDF" },
    ],
  },
  {
    slug: "should-i-get-a-divorce",
    title: "Should I Get a Divorce? A Practical Way to Think About an Impossible Question",
    date: "July 13, 2026",
    description:
      "Unsafe, unhappy, or just overwhelmed? A practical framework: what divorce actually changes financially, what it means for the children, and the one rule to follow before deciding anything.",
    sections: [
      {
        paragraphs: [
          "Nobody types this question into a search bar casually. If you are reading this, you have probably been carrying it for a while, often without knowing where to begin.",
          "An article cannot answer it, and you should be suspicious of any article that tries. A law firm should not push you toward divorce, and it should not talk you into staying. What this article can do is help you ask the question accurately, because “should I get a divorce” is really three different questions depending on what is happening in your home.",
        ],
      },
      {
        heading: "If you are unsafe, this is not a divorce question yet",
        paragraphs: [
          "If there is violence, threats, or a pattern of control that leaves you afraid in your own home, the first question is safety, not paperwork. Do not start by announcing anything. Moments of separation and confrontation can be volatile, so plan quietly and get help first:",
        ],
        bullets: [
          "Korean American Family Service Center, 24-hour Korean/English hotline: (718) 460-3800",
          "New York State domestic violence hotline: 800-942-6906 (text 844-997-2121)",
          "New Jersey statewide domestic violence hotline: 1-800-572-7233",
          "National Domestic Violence Hotline: 800-799-7233 (text START to 88788)",
        ],
      },
      {
        paragraphs: [
          "Both New York and New Jersey courts have procedures for seeking protective orders. A private conversation with an advocate or an attorney can help you understand the available safety and legal options before you decide what to do next. Ask about confidentiality and any fee when scheduling an attorney consultation.",
        ],
        related: [
          { label: "How Do I File a Temporary Restraining Order in New Jersey?", slug: "temporary-restraining-order-new-jersey" },
        ],
      },
      {
        heading: "If the marriage is temporarily overwhelmed, name that honestly",
        paragraphs: [
          "A newborn, a job loss, a failing business, illness, immigration stress, money pressure, a parent moving in. Seasons like these can make a workable marriage feel finished. Some marriages in this category recover when the season passes or when the couple gets real help carrying it. Some do not. The point is to know which problem you are trying to solve before you solve the wrong one. If there is no abuse and no fear in your home, counseling may be worth considering.",
        ],
        related: [
          { label: "Is Marriage Counseling Appropriate?", slug: "is-marriage-counseling-appropriate" },
        ],
      },
      {
        heading: "If the marriage is simply unhappy, you are in the hardest category",
        paragraphs: [
          "No emergency, no dramatic event, just distance that has stopped closing. Two things are true at once. Staying is not automatically noble, and leaving is not automatically freedom. People regret both. This is the category where the practical audit below matters most, because the question “should I divorce” quietly contains a second question: “can I run the life that comes after?”",
          "Do the audit on paper, alone, before making any decision. Not because money should decide your marriage, but because you should decide with your eyes open.",
        ],
      },
      {
        heading: "One household becomes two",
        paragraphs: [
          "The same income that ran one home will run two: two rents or a mortgage plus a rent, two sets of utilities, two of everything the children need in both places. Write down what your area actually costs, not what you hope it costs. And if your spouse’s schedule covered mornings, pickups, or sick days, that childcare has a market price after separation. Price it.",
        ],
      },
      {
        heading: "Insurance and retirement move",
        paragraphs: [
          "Who carries the health insurance today, and who would after? Life insurance beneficiaries, retirement accounts, and pensions are commonly part of a divorce, and retirement money usually cannot be touched early without real cost. In New York, the moment a divorce case starts, automatic court orders under Domestic Relations Law § 236 freeze big financial moves for both spouses: transferring property, withdrawing retirement funds, changing life insurance beneficiaries, or dropping a spouse or child from health coverage. New Jersey’s rules differ, but in both states, money moved around the time of a divorce can be examined later. Your tax filing status changes too, which is a conversation for a tax professional.",
        ],
      },
      {
        heading: "The children’s week, concretely",
        paragraphs: [
          "Not “will they be okay,” which no one can promise in either direction, but the logistics they will live: two homes, one school, exchanges, holidays split, who takes them to practice, where they do homework on Wednesdays. Children ask concrete questions. Parents deciding about divorce should be able to answer them concretely.",
          "If the audit looks frightening, that is not a verdict that you must stay. It may mean support, maintenance, and property division need to do real work in any settlement, which is exactly what a lawyer helps you evaluate. If the audit looks survivable, that is not a verdict that you must go. Either way, you now know what you are actually deciding.",
        ],
      },
      {
        heading: "The one hard rule",
        paragraphs: [
          "Whatever you decide, decide in the right order: before you move money, before you leave the home, and before you sign anything, talk to a lawyer.",
          "People damage their own cases in the quiet weeks before anyone files. They transfer savings to a relative, thinking it is protection. They move out with no interim plan and discover the arrangement they left behind has become the temporary status quo. They sign a “simple agreement” a spouse drafted at the kitchen table. Every one of these is easier to prevent than to repair, and in New York the automatic orders described above make the timing rules explicit once a case begins.",
          "A consultation is not a commitment to divorce. It is an hour in which someone maps your actual situation, your assets, your timeline, your obligations, and what would happen next if you did nothing at all. Many people walk out of that conversation and choose to work on the marriage. That is a fine outcome. They chose it informed.",
        ],
      },
      {
        heading: "Family, faith, and privacy",
        paragraphs: [
          "Family expectations, faith, privacy, and concern about community judgment can all affect how someone approaches divorce. Those concerns are personal and deserve to be considered without assumptions. Gathering information does not commit you to leaving; it helps you understand the available choices. A Korean-language version of this article is available, and the firm can communicate in Korean.",
          "This office works by a simple rule: preserve the family when it can be preserved. Protect the client when it cannot. If your situation is serious, contested, urgent, or simply unclear, contact Jake Kim Law Firm to discuss whether legal representation may be appropriate.",
        ],
      },
    ],
    sources: [
      { label: "N.Y. Domestic Relations Law § 236 (automatic orders) — New York State Senate", url: "https://www.nysenate.gov/legislation/laws/DOM/236" },
      { label: "N.Y. Domestic Relations Law § 170 (grounds for divorce) — New York State Senate", url: "https://www.nysenate.gov/legislation/laws/DOM/170" },
      { label: "Divorce self-help — New Jersey Courts", url: "https://www.njcourts.gov/self-help/divorce" },
      { label: "Korean American Family Service Center (24-hour hotline)", url: "https://www.kafsc.org/" },
      { label: "NYS Office for the Prevention of Domestic Violence — get help", url: "https://opdv.ny.gov/survivors-victims" },
      { label: "Domestic violence self-help — New Jersey Courts", url: "https://www.njcourts.gov/self-help/domestic-violence" },
      { label: "National Domestic Violence Hotline", url: "https://www.thehotline.org/" },
    ],
  },
  {
    slug: "is-marriage-counseling-appropriate",
    title: "Is Marriage Counseling Appropriate? Considerations Before You Decide",
    date: "July 13, 2026",
    description:
      "When counseling deserves a sincere try, when it is the wrong tool entirely, and what to do when your situation is somewhere in between.",
    sections: [
      {
        paragraphs: [
          "Marriage counseling can be useful in some relationships and unsafe or ineffective in others. The appropriate next step depends on the circumstances in the home, including whether both spouses can participate freely and safely.",
        ],
      },
      {
        heading: "When counseling deserves a sincere try",
        paragraphs: [
          "If there is no violence in your home, no threats, no fear, and no pattern of one spouse controlling the other, then counseling is not a detour or a formality. It is often the most useful next step, and it works best before contempt settles in, not after someone has already called a lawyer.",
          "Counseling tends to earn its cost when the problems sound like these: you have stopped talking about anything except logistics; money arguments repeat on a loop without resolution; intimacy faded and neither of you can say when; a hard season, a new baby, a business struggling, immigration stress, aging parents, turned you into coworkers instead of spouses. These are real problems. They are also the kinds of problems couples work through, with structure and a neutral third person in the room.",
          "Two practical notes. First, look for a licensed therapist who actually works with couples; that is a specific skill, not a general one. If you would speak more freely in Korean, asking for a Korean-speaking therapist is a reasonable request, not an unusual one. Second, go in with a fair test: both spouses show up, both participate, and you give it enough sessions to be a real attempt rather than an alibi.",
          "Counseling does not guarantee reconciliation. A useful first question is whether both spouses can participate safely, honestly, and with a genuine willingness to work on the relationship.",
        ],
      },
      {
        heading: "The legal reality, briefly",
        paragraphs: [
          "Neither New York nor New Jersey generally requires proof of marriage counseling before a spouse may file for divorce, and both states recognize no-fault grounds: irretrievable breakdown in New York and irreconcilable differences in New Jersey. Participating in counseling does not by itself file a case or waive the right to seek legal advice.",
        ],
      },
      {
        heading: "When counseling is the wrong tool",
        paragraphs: [
          "If there is abuse in your marriage, physical violence, credible threats, or a pattern of coercive control, joint counseling is not the appropriate next step, and this is not only our view. The National Domestic Violence Hotline puts it plainly: “We do not encourage anyone in an abusive relationship to seek counseling with their partner. Abuse is not a relationship problem.”",
          "The reasons are concrete. Couples counseling assumes two people with roughly equal footing working on a shared problem. Abuse is not a shared problem; it is one person’s conduct. A joint session can become a place where honesty is punished later at home, and what is said in the room can be used against the person who said it. A therapist who does not know about the abuse can be steered by the more controlled, more persuasive spouse.",
          "If this section describes your home, the appropriate next step is a safe, private conversation, not a joint appointment:",
        ],
        bullets: [
          "Korean American Family Service Center, 24-hour Korean/English hotline: (718) 460-3800",
          "New York State domestic violence hotline: 800-942-6906 (text 844-997-2121)",
          "New Jersey statewide domestic violence hotline: 1-800-572-7233",
          "National Domestic Violence Hotline: 800-799-7233 (text START to 88788)",
        ],
      },
      {
        paragraphs: [
          "Both states have court processes for seeking protection.",
        ],
        related: [
          { label: "How Do I File a Temporary Restraining Order in New Jersey?", slug: "temporary-restraining-order-new-jersey" },
        ],
      },
      {
        heading: "When the situation is unclear",
        paragraphs: [
          "Many homes do not sort neatly into “healthy conflict” or “abuse.” Maybe one spouse controls all the money and the information, and the other must ask. Maybe there has never been a hand raised, but there is rage, and you edit what you say to avoid it. Maybe your phone is monitored, or your English is used against you in every disagreement.",
          "A blog post cannot diagnose your marriage. When the facts are unclear, consider starting with a private conversation with an individual therapist, a domestic violence advocate, or an attorney before agreeing to a joint session. Speaking with a lawyer does not by itself start a divorce or notify your spouse. Ask about confidentiality and any consultation fee before sharing sensitive information.",
        ],
      },
      {
        heading: "Faith leaders and therapists serve different roles",
        paragraphs: [
          "For people whose faith is important, a faith leader may provide spiritual guidance and community support. A licensed couples therapist provides a different service focused on the relationship and is subject to professional standards. Some people choose one form of support and some use both. A Korean-language version of this article is available, and the firm can communicate in Korean.",
        ],
      },
      {
        heading: "Where a law office fits",
        paragraphs: [
          "We do not provide counseling, and we will not pretend to. This office works by a simple rule: preserve the family when it can be preserved. Protect the client when it cannot. What a family lawyer answers are the questions that hover around counseling: what filing would actually mean, how protective orders work, what a separation or postnuptial agreement can and cannot do, and what to avoid signing while you work on the marriage.",
          "Before signing or filing anything, consider speaking with an attorney familiar with New York or New Jersey family law. To request a consultation, contact Jake Kim Law Firm. A consultation can help identify which issues require immediate attention.",
        ],
      },
    ],
    sources: [
      { label: "Should I Go to Couples Therapy With My Abusive Partner? — National Domestic Violence Hotline", url: "https://www.thehotline.org/resources/should-i-go-to-couples-therapy-with-my-abusive-partner/" },
      { label: "N.Y. Domestic Relations Law § 170 (grounds for divorce) — New York State Senate", url: "https://www.nysenate.gov/legislation/laws/DOM/170" },
      { label: "Divorce self-help — New Jersey Courts", url: "https://www.njcourts.gov/self-help/divorce" },
      { label: "Korean American Family Service Center (24-hour hotline)", url: "https://www.kafsc.org/" },
      { label: "NYS Office for the Prevention of Domestic Violence — get help", url: "https://opdv.ny.gov/survivors-victims" },
    ],
  },
  {
    slug: "uncontested-vs-contested-divorce-new-york",
    title: "Uncontested and Contested Divorce in New York: What the Difference Means",
    date: "July 13, 2026",
    description:
      "What makes a New York divorce uncontested, what the court charges, how the free DIY forms work, and the automatic orders that take effect when a case starts.",
    sections: [
      {
        paragraphs: [
          "Most people describe their situation the same way: “It should be simple. We both want this.” Sometimes that turns out to be true. Often it does not. A New York divorce may proceed as uncontested when no financial, property, support, or parenting issues remain disputed and the other spouse either agrees or does not appear. When both spouses participate, the practical question is whether they can sign the same answers to a short list of hard questions.",
        ],
      },
      {
        heading: "What “uncontested” actually means",
        paragraphs: [
          "A divorce may proceed as uncontested when there are no unresolved financial, property, support, or parenting disputes and the other spouse either agrees or does not appear in the action. When both spouses are participating, they must agree on all of the following:",
        ],
        bullets: [
          "that the marriage should end;",
          "how property and debts will be divided;",
          "whether either spouse will pay maintenance (spousal support), how much, and for how long;",
          "custody and a parenting schedule, if there are children;",
          "child support.",
        ],
      },
      {
        paragraphs: [
          "When both spouses participate, agreement on most of the list is not enough; any unresolved issue makes the case contested unless and until the parties resolve it.",
          "New York allows no-fault divorce. Under Domestic Relations Law § 170(7), one spouse states under oath that the marriage has broken down irretrievably for at least six months. Nobody has to prove cheating or cruelty. But the same statute has a catch people miss: the court cannot grant the judgment until the money and custody issues are resolved, either by your agreement or by a judge’s decision. No-fault means you do not need a reason. It does not mean the divorce is automatic.",
        ],
      },
      {
        heading: "What makes a divorce contested",
        paragraphs: [
          "One unresolved issue is enough. If either spouse disputes anything on the list above, the case moves through the contested track in Supreme Court: formal financial disclosure, motions where a judge decides temporary questions, negotiation, and, in a small number of cases, trial. Court filing fees are similar either way. What grows is everything around the dispute: time, preparation, and attorney work. The expensive part of a contested divorce is the contest.",
        ],
      },
      {
        heading: "Before either path: the residency rules",
        paragraphs: [
          "New York courts can only hear your divorce if the case meets the residency requirements of Domestic Relations Law § 230. The simplest path is that either spouse has lived in New York for two continuous years before filing. One year can be enough when there is another New York connection, such as the marriage took place here, you lived here together as a married couple, or the grounds arose here. If you and your spouse live in different states, or one of you spends time abroad, sort this question out first. Filing in the wrong court wastes months.",
        ],
      },
      {
        heading: "What the court itself charges",
        paragraphs: [
          "An uncontested divorce costs at least $335 in court filing fees, including the $210 index number fee that opens the case, according to the New York courts’ official guide. Lawyers, process servers, notaries, and copies are separate. If paying the court fees would be a real hardship, you can ask the court for a fee waiver.",
        ],
      },
      {
        heading: "The court’s free forms, and their limit",
        paragraphs: [
          "New York offers a free do-it-yourself uncontested divorce program for couples with no children under 21, and a paper packet for couples with children under 21. For a short marriage with no property, no children, and no support, those forms may be all you need, and it would be dishonest to tell you otherwise.",
          "Their limit is judgment. The forms will not tell you whether the deal you are signing is fair, whether a retirement account should be divided and how, or what happens if either spouse owns property outside the United States. Property-division terms are generally difficult to reopen after judgment, while custody, parenting time, and child support may be modified when the applicable legal standard is met. Agreements are far easier to review before signing than to challenge afterward.",
        ],
      },
      {
        heading: "The rules change the moment a case starts",
        paragraphs: [
          "Filing a divorce in New York triggers automatic orders under Domestic Relations Law § 236B(2)(b). They bind the filing spouse immediately and the other spouse once served. While the case is pending, neither spouse may, among other things:",
        ],
        bullets: [
          "sell, transfer, or hide property, outside ordinary living and business expenses;",
          "withdraw or borrow against retirement accounts;",
          "run up unreasonable new debt;",
          "remove the other spouse or the children from health insurance;",
          "change life insurance beneficiaries.",
        ],
      },
      {
        paragraphs: [
          "A 2026 amendment added a duty to notify the other spouse within ten days of learning about tax liens, foreclosure, bankruptcy, or lawsuits that affect marital property. Violating the automatic orders turns a money question into a court problem. This is one reason the order of operations matters: decisions about accounts, insurance, and the home are best made with advice before papers are filed, not cleaned up after.",
        ],
      },
      {
        heading: "Uncontested can turn contested, and the reverse",
        paragraphs: [
          "These labels describe where your case is today, not where it ends. Plenty of “simple” divorces turn contested when full financial disclosure surfaces something one spouse did not know about. Plenty of contested cases settle completely after a motion or two clarifies the real numbers. Starting uncontested does not lock you in, and starting contested does not sentence you to a trial.",
        ],
      },
      {
        heading: "A quick honesty test",
        paragraphs: [
          "Ask yourself three questions. Have I actually seen the full financial picture, or am I trusting it? Is our parenting schedule written down, specific, and agreed? Do I understand what I am giving up, not just what I am getting? If any answer makes you hesitate, that hesitation is information.",
          "Before signing or filing anything, consider speaking with an attorney familiar with New York family law. Jake Kim Law Firm represents clients in divorce and family matters in New York and New Jersey, and Korean-language communication is available. To request a consultation, contact Jake Kim Law Firm.",
        ],
      },
    ],
    sources: [
      { label: "N.Y. Domestic Relations Law § 170 (grounds for divorce) — New York State Senate", url: "https://www.nysenate.gov/legislation/laws/DOM/170" },
      { label: "N.Y. Domestic Relations Law § 230 (residency requirements) — New York State Senate", url: "https://www.nysenate.gov/legislation/laws/DOM/230" },
      { label: "N.Y. Domestic Relations Law § 236 (automatic orders) — New York State Senate", url: "https://www.nysenate.gov/legislation/laws/DOM/236" },
      { label: "Filing an Uncontested Divorce — New York State Unified Court System", url: "https://www.nycourts.gov/help/family-issues-divorce/filing-uncontested-divorce" },
    ],
  },
  {
    slug: "new-jersey-custody-law-2026",
    title: "New Jersey’s Custody Law Changed in January 2026: What Parents Need to Know",
    date: "July 13, 2026",
    description:
      "New Jersey rewrote its custody statute effective January 20, 2026: child safety as the threshold issue, a stronger voice for children, and new limits on reunification therapy.",
    sections: [
      {
        paragraphs: [
          "If you are in a custody or parenting-time case in New Jersey right now, or expect to start one, the ground rules changed recently. On January 20, 2026, the Governor signed P.L.2025, c.316, a substantial rewrite of the state’s main custody statute, N.J.S.A. 9:2-4. It took effect immediately. Much of what is written online about New Jersey custody, including many law firm websites, describes the older version of the law.",
          "Here is what the amended statute says, in plain language, and what it may mean for your case.",
        ],
      },
      {
        heading: "Child safety is now the threshold question",
        paragraphs: [
          "The amended law states that “the safety of children is of paramount importance and is an integral element of the child’s best interests,” and that custody decisions “shall promote the safety of children as a threshold issue.”",
          "A threshold issue is one the court addresses first. Before weighing schedules, school districts, or which parent has the bigger apartment, the court is directed to deal with safety. For most families this changes nothing day to day, because safety was never in question. In cases involving allegations of domestic violence or child abuse, it moves those questions to the front of the case instead of treating them as one factor among many.",
          "If domestic violence is part of your situation, New Jersey’s restraining-order process is separate from a custody case and is designed to address requests for protection promptly.",
        ],
        related: [
          { label: "How Do I File a Temporary Restraining Order in New Jersey?", slug: "temporary-restraining-order-new-jersey" },
        ],
      },
      {
        heading: "The best-interests factors still exist",
        paragraphs: [
          "New Jersey judges still decide custody by weighing statutory best-interests factors, and most will look familiar: the parents’ ability to communicate and cooperate about the children, each parent’s willingness to accept custody, the child’s relationship with parents and siblings, any history of domestic violence, the safety of the child, the stability of the home, the child’s needs and education, each parent’s fitness, how close the parents live to each other, time each parent spent with the child before and after separation, work responsibilities, and the ages and number of children.",
          "The amended statute also directs courts to consider input from mental-health professionals involved with the child, where that applies. What changed most is not the list itself but the frame around it: safety first, and a stronger role for the child’s own voice.",
        ],
      },
      {
        heading: "Children’s preferences carry more procedural weight",
        paragraphs: [
          "Courts have long been able to consider the preference of a child who is old enough, and mature enough, to form an intelligent opinion. The 2026 amendment adds teeth: when a court decides not to follow a child’s expressed preference, it must “specifically place on the record the factors which justify the court’s decision to disregard the child’s expressed preferences.”",
          "In practice, that means a child’s stated wishes cannot simply be passed over in silence. It does not mean children decide custody, and it does not reward coaching. Judges evaluate whether a preference is the child’s own reasoned view.",
        ],
      },
      {
        heading: "New limits on court-ordered “reunification” programs",
        paragraphs: [
          "Some custody disputes involve a child who resists contact with one parent. Courts have sometimes ordered therapy or programs intended to repair that relationship. The amended statute now sets firm limits. A treatment program intended to reunite a child with a parent the child resists cannot be ordered “without the consent of both parties.” Programs may not rely on “force, threat of force, physical obstruction, undue coercion, verbal abuse, or isolation,” and a child may not be cut off from a safe parent in the name of reunification.",
          "If a reunification program has been proposed or ordered in your case, this is worth immediate attention, because orders entered under older assumptions may now sit uneasily with the statute.",
        ],
      },
      {
        heading: "What this means practically",
        paragraphs: [
          "A hypothetical, clearly labeled as one: two parents separate, and their teenager tells the custody evaluator she wants to live primarily with her mother because of her father’s temper. Under the amended statute, the court addresses the safety question first, considers the daughter’s stated preference, and if it orders something different, must explain on the record why. Any proposal to send her to a reunification program with her father requires both parents’ consent.",
          "For parents heading into a case in 2026, a few habits follow from the new framework:",
        ],
        bullets: [
          "Take documentation seriously. Safety-related claims, in either direction, will be examined early and closely.",
          "Be accurate about history. Overstating or minimizing domestic violence has always been damaging; under a safety-first statute, it is more so.",
          "Let children be children. Pressuring a child to state a preference tends to reveal itself, and the statute rewards a child’s genuine, reasoned voice, not a rehearsed one.",
          "If you have an older order or a pending case, ask how the amendment interacts with it before assuming anything.",
        ],
      },
      {
        heading: "A note about a new statute",
        paragraphs: [
          "This statute is new. Judges across New Jersey are applying it now, and how individual courts will weigh the safety-threshold language, children’s preferences, and the reunification limits in close cases is still taking shape. Anyone who tells you exactly how a 2026 custody case will come out is guessing. What can be said is that preparation, credibility, and documentation matter more, not less, under the new law.",
          "Custody cases are fact-specific, and early decisions, including what you file, what you agree to, and what you put in writing to the other parent, shape everything after. Before filing or responding to anything, consider speaking with an attorney familiar with New Jersey family law. Jake Kim Law Firm handles custody and parenting-time matters in New Jersey and New York, and Korean-language communication is available. To request a consultation, contact Jake Kim Law Firm.",
        ],
      },
    ],
    sources: [
      { label: "P.L.2025, c.316 (S4510) — official chapter law, New Jersey Legislature", url: "https://pub.njleg.gov/Bills/2024/PL25/316_.PDF" },
      { label: "Domestic violence self-help — New Jersey Courts", url: "https://www.njcourts.gov/self-help/domestic-violence" },
    ],
  },
  {
    slug: "non-monied-spouse-new-york-temporary-support",
    title: "If I’m the Non-Monied Spouse in New York, What Do I Actually Get While the Divorce Is Pending?",
    date: "December 14, 2025",
    description:
      "A practical overview of temporary maintenance, child support, counsel fees, and the financial realities facing a lower-earning spouse during a New York divorce.",
    sections: [
      {
        paragraphs: [
          "If you are the lower-earning or non-earning spouse, the immediate question is practical: what financial support may be available while the divorce is pending? Temporary relief exists to address financial imbalance while the case moves forward.",
        ],
      },
      {
        heading: "Temporary support exists for a reason",
        paragraphs: [
          "New York courts may address temporary spousal maintenance, temporary child support, and, in appropriate cases, a contribution toward counsel fees. These remedies are designed to preserve meaningful access to the legal process and reasonable financial stability while the case is pending.",
        ],
      },
      {
        heading: "The statutory formula is a starting point",
        paragraphs: [
          "Temporary maintenance generally begins with a statutory calculation, subject to an income cap and the court’s authority to consider statutory factors. The formula is a presumptive starting point, not a guarantee of a particular lifestyle or final award.",
          "Timing, reliable income information, immediate needs, credibility, and the presence of children can materially affect how temporary issues are resolved in practice.",
        ],
      },
      {
        heading: "Child support is calculated separately",
        paragraphs: [
          "Temporary child support is governed by the Child Support Standards Act and is considered separately from maintenance. The combined effect of temporary maintenance and child support can be significant, particularly where one spouse has historically controlled most of the family income.",
        ],
      },
      {
        heading: "The practical takeaway",
        bullets: [
          "Address temporary financial issues early.",
          "Organize income, expense, and asset information before seeking relief.",
          "Use the available legal mechanisms to create stability while the case proceeds.",
        ],
      },
    ],
  },
  {
    slug: "stay-at-home-spouse-new-york-divorce-cost-support",
    title: "If I’m a Stay-at-Home Spouse in New York, Can I Receive Financial Support While the Case Is Pending?",
    date: "December 14, 2025",
    description:
      "What a stay-at-home spouse should know about divorce costs, temporary support, counsel fees, and realistic timelines in New York.",
    sections: [
      {
        paragraphs: [
          "A stay-at-home spouse often faces three immediate questions: how the case will be funded, whether temporary support is available, and how long the divorce may take. There is no single answer, but there are established legal tools and practical planning steps.",
        ],
      },
      {
        heading: "How divorce counsel is typically paid",
        paragraphs: [
          "Most attorneys require an initial retainer and bill hourly in contested matters. In a financially imbalanced marriage, however, New York courts may direct the higher-earning spouse to contribute toward the other spouse’s legal fees.",
        ],
      },
      {
        heading: "Temporary financial relief",
        bullets: [
          "Temporary spousal maintenance",
          "Temporary child support",
          "Contribution toward counsel fees in appropriate cases",
        ],
        paragraphs: [
          "These mechanisms are intended to prevent one spouse from using control of the family’s finances to impair the other spouse’s ability to participate meaningfully in the case.",
        ],
      },
      {
        heading: "How long a New York divorce may take",
        paragraphs: [
          "An uncontested divorce may be completed within several months after proper filing, depending on the county and court backlog. A contested matter commonly takes a year or longer, particularly where custody, support, business interests, discovery, or motion practice are involved.",
        ],
      },
      {
        heading: "Plan for sequence, not panic",
        paragraphs: [
          "Early organization, prompt attention to temporary issues, and a disciplined litigation sequence can reduce uncertainty and prevent avoidable cost. The objective at the beginning is often stability and usable information—not immediate resolution of every disputed issue.",
        ],
      },
    ],
  },
  {
    slug: "how-divorce-works-new-york",
    title: "How Does Divorce Work in New York?",
    date: "Updated January 13, 2026",
    description:
      "A straightforward guide to New York divorce procedure, the roles of Supreme Court and Family Court, and the issues that affect timing and cost.",
    sections: [
      {
        paragraphs: [
          "Divorce in New York is procedural. Much of the stress comes from not knowing what happens next, which court has authority, or which issues must be addressed first.",
        ],
      },
      {
        heading: "Supreme Court grants the divorce",
        paragraphs: [
          "New York Supreme Court is the only court that can dissolve a marriage. It may also determine equitable distribution, maintenance, custody, child support, and related financial issues within the divorce action.",
        ],
      },
      {
        heading: "Family Court handles many related matters",
        paragraphs: [
          "Family Court commonly handles custody and parenting time, child support, spousal support between married spouses before divorce, paternity, family-offense petitions, and enforcement or modification proceedings. It does not grant a divorce.",
        ],
      },
      {
        heading: "Timing depends on the dispute",
        paragraphs: [
          "An uncontested divorce may be completed in several months after proper filing, subject to county processing times. A contested matter may take a year or longer depending on discovery, court availability, motion practice, financial complexity, and custody disputes.",
        ],
      },
      {
        heading: "What drives cost",
        paragraphs: [
          "Cost is driven primarily by attorney time, the number of disputed issues, motion practice, discovery, expert work, and the duration of the case. Narrowing issues early and using an orderly process can reduce unnecessary expense.",
        ],
      },
      {
        heading: "A simple way to remember the court structure",
        bullets: [
          "Ending the marriage: Supreme Court",
          "Custody or support without a divorce: often Family Court",
          "Orders of protection: commonly Family Court, although related relief may arise elsewhere",
          "Divorce with custody and support: Supreme Court",
        ],
      },
    ],
  },
  {
    slug: "temporary-restraining-order-new-jersey",
    title: "How Do I File a Temporary Restraining Order in New Jersey?",
    date: "Updated December 14, 2025",
    description:
      "A general overview of where a New Jersey domestic-violence temporary restraining order may be requested and what happens after entry.",
    sections: [
      {
        paragraphs: [
          "A temporary restraining order is a court order that may prohibit direct or indirect contact and impose other immediate restraints. A later hearing generally determines whether the temporary order should become a final restraining order.",
        ],
      },
      {
        heading: "Where a request may be made",
        paragraphs: [
          "A person may generally seek relief in the county where the alleged act occurred, where the plaintiff resides, or where the defendant resides. During court hours, applications are ordinarily handled through the Superior Court. Outside court hours, local law enforcement may assist with access to an on-call judge.",
        ],
      },
      {
        heading: "Service and the hearing",
        paragraphs: [
          "The defendant must be served with the order. The order will identify the restrictions in effect and the date of the final hearing. Both parties should preserve messages, photographs, recordings, medical records, witness information, and other relevant evidence.",
        ],
      },
      {
        heading: "The legal standard is fact-specific",
        paragraphs: [
          "New Jersey domestic-violence proceedings require analysis of the alleged predicate act, the parties’ qualifying relationship, the history between the parties, and whether restraints are necessary for protection. Because the consequences are significant, prompt legal advice may be important for either party.",
        ],
      },
    ],
  },
  {
    slug: "lower-earning-spouse-new-jersey-pendente-lite-support",
    title: "If I’m the Lower-Earning Spouse in New Jersey, What Support Is Available While the Divorce Is Pending?",
    date: "Updated July 12, 2026",
    description:
      "Pendente lite support in New Jersey, explained: the statute, the Case Information Statement, how temporary spousal and child support are set, counsel and expert fees, and what temporary orders do—and do not—decide.",
    sections: [
      {
        paragraphs: [
          "If you are the lower-earning or non-earning spouse, the immediate question is practical: what financial support may be available while the divorce is pending? New Jersey answers it with pendente lite relief—temporary orders entered under N.J.S.A. 2A:34-23 while the case moves forward.",
        ],
      },
      {
        heading: "What the statute actually authorizes",
        paragraphs: [
          "Pending any matrimonial action, the court may order support for a spouse and for the children as the circumstances of the parties and the nature of the case make “fit, reasonable and just” (N.J.S.A. 2A:34-23). The same statute permits the court to order one party to pay a retainer for the other’s legal and expert services where the parties’ financial circumstances make that award reasonable and just.",
          "The courts have described the purpose plainly: temporary support preserves the status quo—keeping the household functioning at something close to the marital standard—until the case can be fully investigated. Mallamo v. Mallamo, 280 N.J. Super. 8, 11–12 (App. Div. 1995).",
        ],
      },
      {
        heading: "There is no formula—the Case Information Statement does the work",
        paragraphs: [
          "Unlike New York, New Jersey has no numeric formula for temporary spousal support. The court weighs the marital standard of living, each party’s reasonable needs, and the ability to pay, guided by the statutory alimony factors—which begin with “the actual need and ability of the parties to pay” and include “the standard of living established in the marriage” (N.J.S.A. 2A:34-23(b)). The New Jersey Supreme Court has emphasized that support is measured against a lifestyle reasonably comparable to the marital one. Crews v. Crews, 164 N.J. 11, 16 (2000).",
          "The application is made by motion and is ordinarily decided on the papers—certifications and Case Information Statements—without live testimony (R. 5:5-4(a); Mallamo, 280 N.J. Super. at 12). That makes the Case Information Statement the most important document in the file: a sworn disclosure of income, the marital lifestyle budget, current expenses, assets, and liabilities, filed under Rule 5:5-2 generally within 20 days after the answer, with tax returns, W-2s, and recent paystubs attached. A precise, documented CIS is not busywork; it is the evidence the judge reads.",
        ],
      },
      {
        heading: "Temporary child support follows the Guidelines",
        paragraphs: [
          "Temporary child support is generally set under the New Jersey Child Support Guidelines (R. 5:6A and Appendix IX), an income-shares model that combines both parents’ incomes and allocates the obligation through sole-parenting or shared-parenting worksheets keyed to the overnight schedule. Where one spouse has historically controlled most of the family income, the combined effect of temporary spousal support and Guidelines child support can be substantial.",
        ],
      },
      {
        heading: "Counsel and expert fees can level the field",
        paragraphs: [
          "Fee-shifting in family actions is governed by Rule 5:3-5(c), which directs courts to weigh, among other things, the parties’ financial circumstances, their ability to pay their own fees or contribute to the other’s, the reasonableness and good faith of the positions taken, the fees incurred and previously awarded, and the results obtained. The Supreme Court has framed the core inquiry as need, ability to pay, and the good or bad faith of the parties. Mani v. Mani, 183 N.J. 70, 94–95 (2005). Interim fee awards exist so that control of the marital finances does not become control of the litigation.",
        ],
      },
      {
        heading: "What temporary orders do—and do not—decide",
        paragraphs: [
          "Pendente lite orders are interim by design. They may be revisited as circumstances change, they are subject to adjustment when final judgment is entered, and they do not survive the judgment of divorce unless expressly preserved in it. Mallamo, 280 N.J. Super. at 12. Final alimony is a separate determination made under all of the statutory factors—one of which is the nature, amount, and length of the pendente lite support actually paid (N.J.S.A. 2A:34-23(b)(13)).",
        ],
      },
      {
        heading: "The practical takeaway",
        bullets: [
          "Raise temporary financial issues early; relief is applied for, not automatic.",
          "Treat the Case Information Statement as evidence: complete, accurate, documented.",
          "Understand that a temporary order stabilizes the case; it does not predict the final judgment.",
        ],
      },
    ],
    sources: [
      { label: "N.J.S.A. 2A:34-23 — Alimony, maintenance (pendente lite support; retainers; statutory factors)", url: "https://law.justia.com/codes/new-jersey/title-2a/section-2a-34-23/" },
      { label: "N.J. Court Rule 5:3-5 — Attorney fees and retainer agreements in civil family actions", url: "https://www.womenslaw.org/laws/nj/statutes/53-5-attorney-fees-and-retainer-agreements-civil-family-actions-withdrawal" },
      { label: "N.J. Courts — Family Part Case Information Statement (CN 10482)", url: "https://www.njcourts.gov/sites/default/files/forms/10482_fam_cis.pdf" },
      { label: "Mallamo v. Mallamo, 280 N.J. Super. 8 (App. Div. 1995)", url: "https://www.leagle.com/decision/1995288280njsuper81287" },
      { label: "N.J. Appellate Division opinion applying Crews v. Crews, 164 N.J. 11 (2000) (marital-lifestyle standard)", url: "https://www.njcourts.gov/system/files/court-opinions/2022/a3782-19.pdf" },
      { label: "Mani v. Mani, 183 N.J. 70 (2005) — counsel-fee standard (discussion)", url: "https://www.newjerseydivorcelawyer-blog.com/awards-counsel-fees-matrimonial-actions-new-jersey/" },
    ],
  },
  {
    slug: "stay-at-home-spouse-new-jersey-divorce-cost-support",
    title: "If I’m a Stay-at-Home Spouse in New Jersey, Can I Receive Financial Support While the Case Is Pending?",
    date: "Updated July 12, 2026",
    description:
      "How a New Jersey stay-at-home spouse can fund a divorce: written retainer rules, court-ordered contributions to counsel fees, pendente lite support, and what the timeline through the Early Settlement Panel and economic mediation actually looks like.",
    sections: [
      {
        paragraphs: [
          "A stay-at-home spouse usually faces three immediate questions: how the case will be funded, whether temporary support is available, and how long the divorce may take. There is no single answer, but New Jersey provides established legal tools and a defined process for each.",
        ],
      },
      {
        heading: "How divorce counsel is typically paid",
        paragraphs: [
          "Every fee agreement in a New Jersey civil family action must be in writing, signed, and delivered to the client, together with a Statement of Client Rights and Responsibilities (R. 5:3-5(a)). Most attorneys require an initial retainer and bill hourly in contested matters.",
          "In a financially imbalanced marriage, the retainer is not the end of the analysis. The court may direct one spouse to contribute toward the other’s counsel fees under Rule 5:3-5(c), and the alimony statute itself authorizes the court to order one party to pay a retainer for the other’s legal and expert services where the parties’ financial circumstances make that reasonable and just (N.J.S.A. 2A:34-23). The purpose is straightforward: spouses with unequal finances should still be able to litigate on an equal footing. See Mani v. Mani, 183 N.J. 70, 94–95 (2005).",
        ],
      },
      {
        heading: "Temporary financial relief",
        paragraphs: [
          "While the case is pending, and depending on the record presented in the Case Information Statements, the court may order:",
        ],
        bullets: [
          "Pendente lite spousal support, measured against the marital standard of living (N.J.S.A. 2A:34-23; Crews v. Crews, 164 N.J. 11, 16 (2000))",
          "Temporary child support under the Child Support Guidelines (R. 5:6A)",
          "A contribution toward counsel and expert fees, including a retainer, in appropriate cases (R. 5:3-5(c))",
        ],
      },
      {
        heading: "What the process—and the timeline—actually look like",
        paragraphs: [
          "An uncontested divorce, where everything is agreed, can often be completed within a few months of proper filing, depending on the county’s calendar. A contested case runs on a longer, structured track: Case Information Statements, a case management conference, discovery, and—where children are involved—custody and parenting-time mediation and parent education workshops.",
          "Financial issues then go before a Matrimonial Early Settlement Panel of experienced family lawyers; participation is mandatory when the court refers the case, and submissions are due at least five days before the hearing (R. 5:5-5). If disputes remain, the court may refer the parties to economic mediation, where the mediator’s first two hours are provided without charge. Most cases resolve at or around these stages; contested matters commonly take a year or longer where custody, support, business valuation, or extensive discovery are involved.",
        ],
      },
      {
        heading: "Plan for sequence, not panic",
        paragraphs: [
          "Early organization, prompt attention to temporary issues, and a disciplined litigation sequence reduce uncertainty and avoidable cost. The early objectives are concrete: stabilize support, complete the disclosure the Case Information Statement requires, and let the court’s settlement structure do its work.",
        ],
      },
    ],
    sources: [
      { label: "N.J. Court Rule 5:3-5 — Written retainer agreements; counsel-fee factors", url: "https://www.womenslaw.org/laws/nj/statutes/53-5-attorney-fees-and-retainer-agreements-civil-family-actions-withdrawal" },
      { label: "N.J.S.A. 2A:34-23 — Pendente lite support; retainers for legal and expert services", url: "https://law.justia.com/codes/new-jersey/title-2a/section-2a-34-23/" },
      { label: "N.J. Courts — Contested and Uncontested Divorces (process steps and timing)", url: "https://www.njcourts.gov/self-help/divorce/contested-uncontested" },
      { label: "N.J. Courts — Early Settlement Panels (R. 5:5-5)", url: "https://www.njcourts.gov/courts/family/esp-directory" },
      { label: "N.J. Courts — Economic Mediation in Family Law Cases (first two hours free)", url: "https://www.njcourts.gov/courts/family/family-econ-mediation" },
      { label: "N.J. Appellate Division opinion applying Crews v. Crews, 164 N.J. 11 (2000)", url: "https://www.njcourts.gov/system/files/court-opinions/2022/a3782-19.pdf" },
    ],
  },
  {
    slug: "how-divorce-works-new-jersey",
    title: "How Does Divorce Work in New Jersey?",
    date: "Updated July 12, 2026",
    description:
      "New Jersey divorce, step by step: Family Part jurisdiction, residency and grounds, the Case Information Statement, the Early Settlement Panel and economic mediation, timing, cost drivers, and the FM/FD/FV docket map.",
    sections: [
      {
        paragraphs: [
          "Divorce in New Jersey is procedural. Much of the stress comes from not knowing what happens next, which court has authority, or which issues must be addressed first.",
        ],
      },
      {
        heading: "One court handles the divorce and the related issues",
        paragraphs: [
          "Divorce cases are filed in the Superior Court of New Jersey, Chancery Division, Family Part, in the appropriate county. Unlike New York—where the Supreme Court grants the divorce and the Family Court handles many related matters—the Family Part can resolve the divorce itself together with equitable distribution, alimony, custody and parenting time, and child support in a single action.",
        ],
      },
      {
        heading: "Filing basics: residency, grounds, and venue",
        paragraphs: [
          "At least one spouse must generally have been a bona fide New Jersey resident for the twelve consecutive months before filing (N.J.S.A. 2A:34-10; a narrow exception exists for adultery). Most cases proceed on irreconcilable differences that have caused the breakdown of the marriage for at least six months, with no reasonable prospect of reconciliation (N.J.S.A. 2A:34-2(i))—a ground that does not require the spouses to live separately. An eighteen-month separation and traditional fault grounds remain available. Venue ordinarily lies in the county where the parties last lived together (R. 5:7-1).",
        ],
      },
      {
        heading: "The middle of the case is built around disclosure and settlement",
        paragraphs: [
          "Where support, custody, or property is disputed, each party files a Case Information Statement—a sworn financial disclosure covering income, the marital lifestyle budget, current expenses, assets, and liabilities—generally within 20 days after the answer, with tax returns and recent paystubs attached (R. 5:5-2; Form CN 10482). Case management conferences set the discovery schedule; parents of minor children attend parent education workshops, and disputed custody issues are referred to court-provided custody and parenting-time mediation.",
          "Financial disputes are then reviewed by a Matrimonial Early Settlement Panel—experienced family lawyers who study each side’s submissions and recommend settlement terms; participation is mandatory when ordered, with papers due at least five days before the hearing (R. 5:5-5). If issues remain, the court may refer the parties to economic mediation, where the mediator’s first two hours are free. Many counties then hold an intensive settlement conference before trial. Trial is the exception; most cases resolve inside this structure.",
        ],
      },
      {
        heading: "Timing depends on the dispute",
        paragraphs: [
          "An uncontested divorce can often be completed in a few months after proper filing, subject to county processing times. A contested matter may take a year or longer depending on discovery, court availability, motion practice, financial complexity, and custody disputes.",
        ],
      },
      {
        heading: "What drives cost",
        paragraphs: [
          "Cost is driven primarily by attorney time, the number of disputed issues, motion practice, discovery, expert work, and the duration of the case. Narrowing issues early and using the court’s settlement structure reduces unnecessary expense.",
        ],
      },
      {
        heading: "A simple way to remember the docket structure",
        bullets: [
          "Divorce and the issues within it: the FM (dissolution) docket",
          "Custody or support without a divorce: the FD (non-dissolution) docket",
          "Restraining orders: the FV (domestic violence) docket",
          "All three are heard in the Family Part of the Superior Court (Administrative Directive #07-17)",
        ],
      },
    ],
    sources: [
      { label: "N.J. Courts — Divorce (grounds, residency, venue, filing)", url: "https://www.njcourts.gov/self-help/divorce" },
      { label: "N.J.S.A. 2A:34-2 — Causes for divorce (irreconcilable differences, N.J.S.A. 2A:34-2(i))", url: "https://law.justia.com/codes/new-jersey/title-2a/section-2a-34-2/" },
      { label: "WomensLaw — New Jersey divorce residency requirement (N.J.S.A. 2A:34-10)", url: "https://www.womenslaw.org/laws/nj/divorce" },
      { label: "N.J. Courts — Family Part Case Information Statement (CN 10482)", url: "https://www.njcourts.gov/sites/default/files/forms/10482_fam_cis.pdf" },
      { label: "N.J. Courts — Contested and Uncontested Divorces (process and timing)", url: "https://www.njcourts.gov/self-help/divorce/contested-uncontested" },
      { label: "N.J. Courts — Early Settlement Panels and Economic Mediation", url: "https://www.njcourts.gov/courts/family/family-econ-mediation" },
      { label: "N.J. Courts — Administrative Directive #07-17 (Family Division docket types)", url: "https://www.njcourts.gov/sites/default/files/administrative-directives/2017/06/dir_07_17.pdf" },
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
