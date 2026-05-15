import { messagesAr, messagesEn } from '../i18n/messages'

/** شكل المحتوى القابل للتعديل من Supabase — يدمج مع messages للواجهة الثابتة */
export type SiteContentMap = {
  hero: {
    ar: { title: string; subtitle: string; browseTests: string; bookNow: string }
    en: { title: string; subtitle: string; browseTests: string; bookNow: string }
  }
  feature_bar: {
    ar: { title: string; description: string }[]
    en: { title: string; description: string }[]
  }
  why_urgen: {
    ar: { eyebrowLead: string; eyebrowPunct: string; title: string; subtitle: string; items: { title: string; description: string }[] }
    en: { eyebrowLead: string; eyebrowPunct: string; title: string; subtitle: string; items: { title: string; description: string }[] }
  }
  tests_preview: {
    ar: { eyebrow: string; title: string; subtitle: string; viewAll: string }
    en: { eyebrow: string; title: string; subtitle: string; viewAll: string }
  }
  cta: {
    ar: { title: string; subtitle: string; button: string }
    en: { title: string; subtitle: string; button: string }
  }
  about: {
    ar: { eyebrow: string; title: string; subtitle: string; p1: string; p2: string; values: { title: string; description: string }[] }
    en: { eyebrow: string; title: string; subtitle: string; p1: string; p2: string; values: { title: string; description: string }[] }
  }
  technology: {
    ar: { eyebrow: string; title: string; subtitle: string; intro: string; items: { title: string; description: string }[] }
    en: { eyebrow: string; title: string; subtitle: string; intro: string; items: { title: string; description: string }[] }
  }
  contact: {
    ar: { eyebrow: string; title: string; subtitle: string; address: string; email: string }
    en: { eyebrow: string; title: string; subtitle: string; address: string; email: string }
  }
}

export const defaultSiteContent: SiteContentMap = {
  hero: {
    ar: {
      title: messagesAr.hero.title,
      subtitle: messagesAr.hero.subtitle,
      browseTests: messagesAr.hero.browseTests,
      bookNow: messagesAr.hero.bookNow,
    },
    en: {
      title: messagesEn.hero.title,
      subtitle: messagesEn.hero.subtitle,
      browseTests: messagesEn.hero.browseTests,
      bookNow: messagesEn.hero.bookNow,
    },
  },
  feature_bar: {
    ar: messagesAr.featureBar.map((x) => ({ ...x })),
    en: messagesEn.featureBar.map((x) => ({ ...x })),
  },
  why_urgen: {
    ar: {
      eyebrowLead: messagesAr.whyUrgen.eyebrowLead,
      eyebrowPunct: messagesAr.whyUrgen.eyebrowPunct,
      title: messagesAr.whyUrgen.title,
      subtitle: messagesAr.whyUrgen.subtitle,
      items: messagesAr.whyUrgen.items.map((x) => ({ ...x })),
    },
    en: {
      eyebrowLead: messagesEn.whyUrgen.eyebrowLead,
      eyebrowPunct: messagesEn.whyUrgen.eyebrowPunct,
      title: messagesEn.whyUrgen.title,
      subtitle: messagesEn.whyUrgen.subtitle,
      items: messagesEn.whyUrgen.items.map((x) => ({ ...x })),
    },
  },
  tests_preview: {
    ar: { ...messagesAr.testsPreview },
    en: { ...messagesEn.testsPreview },
  },
  cta: {
    ar: { ...messagesAr.cta },
    en: { ...messagesEn.cta },
  },
  about: {
    ar: {
      eyebrow: messagesAr.about.eyebrow,
      title: messagesAr.about.title,
      subtitle: messagesAr.about.subtitle,
      p1: messagesAr.about.p1,
      p2: messagesAr.about.p2,
      values: messagesAr.about.values.map((x) => ({ ...x })),
    },
    en: {
      eyebrow: messagesEn.about.eyebrow,
      title: messagesEn.about.title,
      subtitle: messagesEn.about.subtitle,
      p1: messagesEn.about.p1,
      p2: messagesEn.about.p2,
      values: messagesEn.about.values.map((x) => ({ ...x })),
    },
  },
  technology: {
    ar: {
      eyebrow: messagesAr.technologyPage.eyebrow,
      title: messagesAr.technologyPage.title,
      subtitle: messagesAr.technologyPage.subtitle,
      intro: messagesAr.technologyPage.intro,
      items: messagesAr.technologyPage.items.map((x) => ({ ...x })),
    },
    en: {
      eyebrow: messagesEn.technologyPage.eyebrow,
      title: messagesEn.technologyPage.title,
      subtitle: messagesEn.technologyPage.subtitle,
      intro: messagesEn.technologyPage.intro,
      items: messagesEn.technologyPage.items.map((x) => ({ ...x })),
    },
  },
  contact: {
    ar: {
      eyebrow: messagesAr.contact.eyebrow,
      title: messagesAr.contact.title,
      subtitle: messagesAr.contact.subtitle,
      address: messagesAr.contact.address,
      email: 'info@urgenlab.com',
    },
    en: {
      eyebrow: messagesEn.contact.eyebrow,
      title: messagesEn.contact.title,
      subtitle: messagesEn.contact.subtitle,
      address: messagesEn.contact.address,
      email: 'info@urgenlab.com',
    },
  },
}

export type SiteContentKey = keyof SiteContentMap
