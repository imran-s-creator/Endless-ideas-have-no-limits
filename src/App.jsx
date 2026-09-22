import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from './auth/useAuth.js'
import { createIdea, createOffer, loadBuyerPurchases, loadCreatorCounts, loadCreatorIdeas, loadIdeaBySlug, loadIdeas, loadLicenses, loadMessages, loadOffers, loadProfiles, loadProtectedIdea, loadSavedIdeas, loadTransactions, purchaseIdea, sendMessage, toggleSavedIdea, updateOfferStatus } from './lib/supabase.js'

const navItems = [
  { label: 'Explore', to: '/explore' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Creators', to: '/creators' },
  { label: 'For Companies', to: '/companies' },
]

const ideaListings = [
  {
    id: 'queue-system',
    title: 'Smart Queue System for Campus Cafeterias',
    category: 'Campus Technology',
    stage: 'Concept',
    price: '₹12,000',
    interest: '84% community interest',
    views: '1.2k views',
    creator: 'Ayesha K.',
    initials: 'AK',
  },
  {
    id: 'inventory-assistant',
    title: 'Inventory Assistant for Small Retail Stores',
    category: 'Retail',
    stage: 'Early Validation',
    price: '₹18,000',
    interest: '92% community interest',
    views: '2.1k views',
    creator: 'Mark R.',
    initials: 'MR',
  },
  {
    id: 'research-match',
    title: 'Student Research Match Engine',
    category: 'Education / SaaS',
    stage: 'Prototype',
    price: '₹15,000',
    interest: '79% community interest',
    views: '1.6k views',
    creator: 'Nina S.',
    initials: 'NS',
  },
  {
    id: 'clinic-scheduling',
    title: 'Clinic Follow-Up Scheduling Assistant',
    category: 'Healthcare',
    stage: 'Launch Ready',
    price: '₹22,000',
    interest: '88% community interest',
    views: '1.9k views',
    creator: 'Priya N.',
    initials: 'PN',
  },
]

function useMarketplaceIdeas() {
  const [ideas, setIdeas] = useState([])

  useEffect(() => {
    let mounted = true
    loadIdeas().then(({ data }) => {
      if (!mounted || !data) return
      setIdeas(data.map((idea) => ({
        ...idea,
        creator: idea.profiles?.name ?? 'ENDLESS creator',
        initials: (idea.profiles?.name ?? 'EC').slice(0, 2).toUpperCase(),
        price: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(idea.asking_price),
        interest: `${idea.saves ?? 0} saves`,
        views: `${idea.views ?? 0} views`,
        rights_type: idea.purchase_type,
      })))
    })
    return () => { mounted = false }
  }, [])

  return ideas
}

function IdeaStatusBadge({ idea }) {
  return idea.status === 'sold' ? <span className="state-badge sold-badge">SOLD</span> : <span className="stage-pill">{idea.stage}</span>
}

function SaveIdeaButton({ idea }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const handleSave = async () => {
    if (!user) return navigate(`/login?redirect=${encodeURIComponent(`/idea/${idea.slug ?? idea.id}`)}`)
    setIsSaving(true)
    const result = await toggleSavedIdea(user.id, idea.id, saved)
    setIsSaving(false)
    if (!result.error) setSaved((current) => !current)
  }
  return <button type="button" className="save-button" onClick={handleSave} disabled={isSaving}>{saved ? 'Saved' : 'Save'}</button>
}

function ideaPrice(idea) {
  return idea.status === 'sold' ? 'Sold' : idea.price
}

const filterGroups = [
  { title: 'Category', items: ['All Ideas', 'Advertising', 'Apps', 'Websites', 'Business', 'Marketing', 'Branding', 'Products', 'Design', 'AI & Technology', 'Education', 'Finance', 'Health & Wellness', 'Food & Restaurants', 'E-commerce', 'Social & Community', 'Entertainment', 'Gaming', 'Travel & Transportation', 'Sustainability', 'Campus & Students', 'Creators & Content', 'Events & Experiences', 'Retail', 'Productivity & Work', 'Security & Privacy', 'Real Estate & Smart Living', 'Fashion & Lifestyle'] },
  { title: 'Industry', items: ['All', 'Education', 'Healthcare', 'Retail', 'Business', 'Design', 'Fashion', 'Food & Restaurants'] },
  { title: 'Price', items: ['Any', 'Under ₹10k', '₹10k-₹25k', '₹25k+'] },
  { title: 'Idea Stage', items: ['Concept', 'Prototype', 'Early Validation', 'Launch Ready'] },
  { title: 'Purchase Type', items: ['Full Ownership', 'Exclusive License', 'Non-Exclusive License', 'Transferable Rights'] },
  { title: 'Community Interest', items: ['High', 'Medium', 'New'] },
]

const categories = [
  ['advertising', 'Advertising', 'Campaigns, promotions and advertising concepts.', 124, ['Ad Campaign Ideas', 'Social Media Ad Ideas', 'Video Ad Ideas', 'Brand Promotion Ideas', 'Product Launch Campaigns', 'Influencer Campaign Ideas', 'Viral Campaign Concepts', 'Local Advertising Ideas']],
  ['banners-creatives', 'Banners & Creatives', 'Banners, posters and campaign creative concepts.', 86, ['Website Banner Ideas', 'Social Media Banner Ideas', 'Digital Poster Ideas', 'Campaign Creative Ideas', 'Promotional Design Ideas', 'Event Banner Ideas']],
  ['apps', 'Apps', 'Mobile, web and utility app concepts.', 218, ['Mobile App Ideas', 'Web App Ideas', 'Productivity Apps', 'Social Apps', 'Education Apps', 'Finance Apps', 'Health & Fitness Apps', 'Utility Apps', 'Community Apps']],
  ['websites', 'Websites', 'Platforms, marketplaces and useful web products.', 174, ['Website Concepts', 'Marketplace Ideas', 'Community Platforms', 'Portfolio Platforms', 'Service Platforms', 'E-commerce Websites', 'Content Platforms', 'Booking Platforms']],
  ['business', 'Business', 'Startup, service and marketplace business concepts.', 196, ['Startup Ideas', 'Small Business Ideas', 'Local Business Concepts', 'Online Business Ideas', 'Service Business Ideas', 'Subscription Business Ideas', 'Marketplace Business Ideas', 'B2B Business Ideas']],
  ['marketing', 'Marketing', 'Growth, acquisition and customer engagement ideas.', 142, ['Marketing Campaigns', 'Growth Ideas', 'Customer Acquisition', 'Referral Ideas', 'Brand Awareness', 'Product Marketing', 'Content Marketing', 'Community Marketing']],
  ['branding', 'Branding', 'Brand concepts, names and identity directions.', 98, ['Brand Concepts', 'Brand Names', 'Brand Identity Ideas', 'Logo Concepts', 'Packaging Concepts', 'Rebranding Ideas', 'Brand Campaigns']],
  ['products', 'Products', 'Physical, digital and smart product opportunities.', 163, ['Physical Product Ideas', 'Digital Product Ideas', 'Consumer Products', 'Smart Products', 'Product Improvements', 'Product Features', 'Product Packaging']],
  ['design', 'Design', 'UI, UX, graphic and visual identity ideas.', 151, ['UI Design Ideas', 'UX Ideas', 'Graphic Design Ideas', 'Poster Ideas', 'Packaging Design', 'Motion Design', 'Illustration Concepts', 'Visual Identity Ideas']],
  ['technology', 'AI & Technology', 'Tools, automation and software concepts.', 205, ['AI Product Ideas', 'AI Tools', 'Automation Ideas', 'Developer Tools', 'Software Concepts', 'Productivity Technology', 'Smart Systems', 'Emerging Technology Concepts']],
  ['education', 'Education', 'Learning, student and campus technology ideas.', 132, ['EdTech Ideas', 'Learning Platforms', 'Student Tools', 'Teacher Tools', 'Study Apps', 'Skill Learning', 'Campus Solutions', 'Online Learning']],
  ['finance', 'Finance', 'FinTech, payments and financial education ideas.', 117, ['FinTech Ideas', 'Payment Solutions', 'Budgeting Tools', 'Savings Concepts', 'Financial Education', 'Small Business Finance', 'Personal Finance Tools']],
  ['health', 'Health & Wellness', 'Informational health, fitness and wellness platforms.', 104, ['Health Platforms', 'Fitness Concepts', 'Wellness Apps', 'Mental Wellness Tools', 'Healthcare Technology', 'Healthy Lifestyle Products']],
  ['food', 'Food & Restaurants', 'Food businesses, restaurants and ordering systems.', 95, ['Food Business Ideas', 'Restaurant Concepts', 'Food Delivery Ideas', 'Food Ordering Systems', 'Kitchen Technology', 'Cafe Concepts', 'Food Packaging', 'Campus Food Solutions']],
  ['ecommerce', 'E-commerce', 'Online stores, shopping and retail technology.', 128, ['Online Store Concepts', 'Shopping Platforms', 'Product Discovery', 'Customer Experience', 'Delivery Solutions', 'Marketplace Concepts', 'Retail Technology']],
  ['social-community', 'Social & Community', 'Social platforms, networks and communities.', 145, ['Social Platform Ideas', 'Community Platforms', 'Networking Ideas', 'Creator Communities', 'Student Communities', 'Local Communities', 'Collaboration Platforms']],
  ['entertainment', 'Entertainment', 'Media, events and entertainment experiences.', 88, ['Content Platforms', 'Streaming Concepts', 'Gaming Ideas', 'Event Concepts', 'Creator Tools', 'Media Platforms', 'Entertainment Experiences']],
  ['gaming', 'Gaming', 'Games, mechanics, tools and gaming communities.', 112, ['Mobile Game Concepts', 'PC Game Ideas', 'Web Game Ideas', 'Game Mechanics', 'Gaming Platforms', 'Gaming Communities', 'Game Tools']],
  ['travel', 'Travel & Transportation', 'Travel planning, booking and transport solutions.', 79, ['Travel Platforms', 'Trip Planning', 'Local Travel', 'Transportation Solutions', 'Booking Concepts', 'Navigation Ideas', 'Travel Community Platforms']],
  ['sustainability', 'Sustainability', 'Eco-friendly, recycling and green technology ideas.', 91, ['Eco-Friendly Products', 'Recycling Ideas', 'Waste Management', 'Energy Solutions', 'Sustainable Business', 'Green Technology', 'Environmental Platforms']],
  ['campus', 'Campus & Students', 'College, campus and student-life solutions.', 119, ['College Apps', 'Campus Services', 'Student Communities', 'Hostel Solutions', 'Campus Food Solutions', 'Student Productivity', 'College Event Ideas', 'Student Marketplace']],
  ['creator-content', 'Creators & Content', 'Creator tools, content platforms and monetization.', 138, ['Creator Tools', 'Content Platforms', 'Video Ideas', 'Photography Platforms', 'Editing Tools', 'Creator Monetization', 'Content Discovery']],
  ['events', 'Events & Experiences', 'Events, exhibitions and interactive experiences.', 73, ['Event Concepts', 'College Events', 'Brand Events', 'Interactive Experiences', 'Exhibition Ideas', 'Community Events', 'Entertainment Experiences']],
  ['retail', 'Retail', 'Store concepts, shopping and inventory solutions.', 109, ['Store Concepts', 'Retail Technology', 'Customer Experience', 'Smart Shopping', 'Inventory Solutions', 'Retail Marketing', 'Local Retail Ideas']],
  ['productivity', 'Productivity & Work', 'Tools for teams, workflows and remote work.', 156, ['Productivity Tools', 'Collaboration Tools', 'Team Management', 'Task Management', 'Workflow Ideas', 'Remote Work Solutions', 'Workplace Tools']],
  ['security', 'Security & Privacy', 'Privacy, identity and secure communication concepts.', 67, ['Digital Security Concepts', 'Privacy Tools', 'Account Security', 'Data Protection Ideas', 'Identity Protection', 'Secure Communication']],
  ['real-estate', 'Real Estate & Smart Living', 'Property, home services and smart-living ideas.', 82, ['Property Platforms', 'Smart Home Ideas', 'Rental Solutions', 'Property Management', 'Home Services', 'Smart Living Concepts']],
  ['fashion', 'Fashion & Lifestyle', 'Fashion, accessories and lifestyle experiences.', 97, ['Fashion Concepts', 'Clothing Brands', 'Lifestyle Products', 'Accessories', 'Personalization Ideas', 'Fashion Technology', 'Shopping Experiences']],
]

const categoryMap = Object.fromEntries(categories.map((category) => [category[0], category]))

const steps = [
  { number: '01', title: 'Share', text: 'Turn your idea into a structured listing.' },
  { number: '02', title: 'Get Discovered', text: 'Companies discover ideas through the marketplace.' },
  { number: '03', title: 'Connect', text: 'Talk directly with interested buyers.' },
  { number: '04', title: 'Create Value', text: 'Sell, license, build, or transfer your idea.' },
]

const detailMetrics = [
  { label: 'Creator Asking Price', value: '₹18,000' },
  { label: 'Community Interest', value: '92%' },
  { label: 'Views', value: '1.8K' },
  { label: 'Saves', value: '240' },
  { label: 'Platform Activity', value: 'High' },
]

const rights = ['Full Ownership', 'Exclusive License', 'Non-Exclusive License', 'Transferable Rights']

const _messages = [
  { from: 'company', text: 'We’re interested in understanding the target customer segment.' },
  { from: 'creator', text: 'I can provide additional information through the protected details request.' },
]

const timeline = [
  { label: 'Created by', value: 'Creator A' },
  { label: 'First Sale', value: 'Creator A → Company B' },
  { label: 'Resold', value: 'Company B → Company C' },
  { label: 'Current Rights Holder', value: 'Company C' },
]

const companyStats = [
  { label: 'Saved Ideas', value: '12' },
  { label: 'Purchased Ideas', value: '4' },
  { label: 'Active Licenses', value: '2' },
  { label: 'Open Offers', value: '3' },
]

function BrandMark({ compact = false, light = false }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      className={`brand-mark-svg ${compact ? 'compact' : ''} ${light ? 'light' : ''}`}
      draggable="false"
    />
  )
}

function usePageTitle(title) {
  useEffect(() => {
    document.title = `ENDLESS — ${title}`
  }, [title])
}

function AppShell({ children }) {
  const location = useLocation()
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const currentTitle = useMemo(() => {
    const map = {
      '/': 'Ideas marketplace',
      '/explore': 'Explore ideas',
      '/idea/inventory-assistant': 'Inventory Assistant',
      '/submit': 'Submit an idea',
      '/creators': 'Creators',
      '/creator/mark-reynolds': 'Mark Reynolds',
      '/companies': 'For companies',
      '/how-it-works': 'How it works',
      '/messages': 'Messages',
      '/offers': 'Offers',
      '/purchased': 'Purchased ideas',
      '/dashboard/purchased': 'Purchased ideas',
      '/licenses': 'Licenses',
      '/dashboard/licenses': 'Licenses',
      '/transfer': 'Transfer & resale',
      '/saved': 'Saved ideas',
      '/transactions': 'Transactions',
      '/dashboard': 'Dashboard',
      '/dashboard/creator': 'Creator dashboard',
      '/dashboard/company': 'Company dashboard',
      '/settings': 'Settings',
      '/login': 'Login',
      '/signup': 'Create account',
      '/forgot-password': 'Reset password',
      '/search': 'Search',
      '/privacy': 'Privacy Policy',
    }

    if (location.pathname.startsWith('/idea/')) return 'Idea details'
    if (location.pathname.startsWith('/creator/')) return 'Creator profile'
    if (location.pathname.startsWith('/category/')) return 'Idea category'
    return map[location.pathname] ?? 'ENDLESS'
  }, [location.pathname])

  usePageTitle(currentTitle)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="app-shell">
      <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
        <Link className="brand" to="/" aria-label="ENDLESS home">
          <BrandMark compact />
          <span className="brand-copy"><span className="wordmark">ENDLESS</span><span className="brand-tagline">Ideas have no limits.</span></span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {isLoading ? <span className="auth-nav-loading" aria-label="Checking authentication"></span> : isAuthenticated ? <>
          <div className={`nav-search ${searchOpen ? 'is-open' : ''}`}>
            {searchOpen && <input autoFocus type="search" placeholder="Search ideas, creators, industries…" aria-label="Search ideas, creators, industries" onKeyDown={(event) => { if (event.key === 'Enter' && event.currentTarget.value) window.location.href = `/search?q=${encodeURIComponent(event.currentTarget.value)}` }} />}
            <button type="button" className="icon-button search-trigger" aria-label={searchOpen ? 'Close search' : 'Open search'} onClick={() => setSearchOpen((open) => !open)}><span className="icon-search"></span></button>
          </div>
          <Link to="/messages" className="icon-button nav-icon" aria-label="Messages"><span className="icon-message"></span><i className="unread-dot"></i></Link>
          <button type="button" className="icon-button nav-icon" aria-label="Notifications"><span className="icon-bell"></span></button>
          <Link to="/submit" className="submit-nav-button">Submit an Idea</Link>
          <div className="profile-menu-wrap">
            <button type="button" className="profile-trigger" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}><span className="profile-avatar-small">{user?.name?.slice(0, 2).toUpperCase()}</span><span className="profile-chevron">⌄</span></button>
            {profileOpen && <div className="profile-menu"><div className="profile-menu-user"><strong>{user?.name}</strong><span>{user?.email}</span><small>{user?.accountType === 'company' ? 'Company / Buyer' : 'Creator'}</small></div><Link to={`/creator/${user?.id}`}>Profile</Link><Link to={user?.accountType === 'company' ? '/dashboard/company' : '/dashboard/creator'}>Dashboard</Link><Link to="/saved">Saved Ideas</Link><Link to="/dashboard/purchased">Purchased Ideas</Link><Link to="/offers">Offers</Link><Link to="/messages">Messages</Link><Link to="/transactions">Transactions</Link><Link to="/settings">Settings</Link><button type="button" onClick={async () => { await signOut(); setProfileOpen(false) }}>Sign Out</button></div>}
          </div>
          </> : <><Link to="/login" className="link-button">Sign In</Link><Link to="/submit" className="submit-nav-button">Submit an Idea</Link><Link to="/signup" className="secondary-button nav-get-started">Get Started</Link></>}
          <button type="button" className="menu-button" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-drawer-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-drawer" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div className="brand">
                <BrandMark compact />
                <span className="brand-copy"><span className="wordmark">ENDLESS</span><span className="brand-tagline">Ideas have no limits.</span></span>
              </div>
              <button type="button" className="drawer-close" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            <nav className="drawer-nav">
              {navItems.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
              <NavLink to="/messages">Messages</NavLink>
              <NavLink to={user?.accountType === 'creator' ? '/dashboard/creator' : '/dashboard/company'}>Dashboard</NavLink>
              <NavLink to="/saved">Saved Ideas</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </nav>
            <div className="drawer-actions">
              <Link to="/submit" className="secondary-button">Submit an Idea</Link>
              {!isAuthenticated && <Link to="/signup" className="primary-button">Get Started</Link>}
            </div>
          </aside>
        </div>
      )}

      {children}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="brand footer-brand">
            <BrandMark compact />
            <span className="wordmark">ENDLESS</span>
          </div>
          <p>Ideas have no limits.</p>
          <div className="founder" aria-label="Founder: Imran">
            <img className="founder-photo" src="/imran-founder.png" alt="Imran" />
            <span className="founder-divider" aria-hidden="true"></span>
            <span className="founder-copy">
              <span className="founder-role">Founder</span>
              <span className="founder-name">Imran</span>
            </span>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/explore">Explore</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/creators">Creators</Link>
          <Link to="/companies">For Companies</Link>
          <Link to="/submit">Submit an Idea</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/404">Terms</Link>
        </nav>
      </footer>
    </div>
  )
}

function Reveal({ children, className = '' }) {
  const [visible, setVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.18 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef])

  return <div ref={elementRef} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>
}

function IdeaSystemGraphic() {
  return (
    <div className="idea-system" aria-label="A visual showing an idea becoming a connection, value, and build">
      <div className="system-grid"></div>
      <div className="system-orbit orbit-one"></div>
      <div className="system-orbit orbit-two"></div>
      <div className="system-path path-one"></div>
      <div className="system-path path-two"></div>
      <div className="system-node node-idea"><span>IDEA</span><i></i></div>
      <div className="system-node node-connect"><span>CONNECT</span><i></i></div>
      <div className="system-node node-value"><span>VALUE</span><i></i></div>
      <div className="system-node node-build"><span>BUILD</span><i></i></div>
      <div className="system-caption">One thought.<br />Many possible futures.</div>
    </div>
  )
}

function StoryGraphic({ type }) {
  if (type === 'discover') {
    return <div className="story-graphic discover-graphic"><div className="story-line"></div><div className="story-point point-a"></div><div className="story-point point-b"></div><div className="story-point point-c"></div><div className="story-label label-a">01 / DISCOVER</div><div className="story-label label-b">150+ ideas</div></div>
  }

  if (type === 'connect') {
    return <div className="story-graphic connect-graphic"><div className="connect-ring ring-a"></div><div className="connect-ring ring-b"></div><div className="connect-person person-a">A</div><div className="connect-person person-b">C</div><div className="connect-thread"></div><div className="story-label label-a">02 / CONNECT</div></div>
  }

  if (type === 'acquire') {
    return <div className="story-graphic acquire-graphic"><div className="rights-layer layer-creator">CREATOR</div><div className="rights-layer layer-agreement">AGREEMENT</div><div className="rights-layer layer-buyer">BUYER</div><div className="rights-layer layer-rights">RIGHTS</div><div className="story-label label-a">03 / ACQUIRE</div></div>
  }

  return <div className="story-graphic build-graphic"><div className="build-frame"><span></span><span></span><span></span><span></span></div><div className="build-axis"></div><div className="story-label label-a">04 / BUILD</div><div className="story-label label-b">Take it forward</div></div>
}

function HomePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      {loading && <div className="loading-screen" aria-live="polite" aria-label="Loading ENDLESS"><BrandMark /><span className="loading-word">ENDLESS</span></div>}
      <main className="premium-home">
        <section className="cinematic-hero">
          <div className="hero-copy premium-hero-copy">
            <div className="eyebrow hero-label">IDEAS MARKETPLACE</div>
            <h1>An idea can become<br /><em>something bigger.</em></h1>
            <p>Discover original ideas, connect with the people behind them, and find opportunities to build what comes next.</p>
            <div className="hero-actions"><Link to="/explore" className="primary-button large">Explore Ideas</Link><Link to="/submit" className="secondary-button large">Submit an Idea</Link></div>
          </div>
          <IdeaSystemGraphic />
          <a href="#story" className="scroll-cue"><span>Scroll to explore</span><i></i></a>
        </section>

        <section className="editorial-intro" id="story"><Reveal><div className="eyebrow">The ENDLESS system</div><h2>A good idea is only the beginning.</h2><p>ENDLESS gives ideas a place to gather momentum. Discover a point of view, meet the person behind it, and choose what happens next.</p></Reveal></section>

        <section className="story-section"><Reveal className="story-copy"><div className="story-index">01</div><div className="eyebrow">Discover</div><h2>Find ideas outside your usual perspective.</h2><p>Browse a considered marketplace of original thinking across industries, stages, and ambitions.</p><Link to="/explore" className="text-link">Explore the marketplace <span>↗</span></Link></Reveal><Reveal className="story-visual"><StoryGraphic type="discover" /></Reveal></section>
        <section className="story-section story-reverse"><Reveal className="story-copy"><div className="story-index">02</div><div className="eyebrow">Connect</div><h2>Talk directly with the person behind the idea.</h2><p>Ask better questions, share context, and move from interest to a useful conversation.</p><Link to="/messages" className="text-link">Open conversations <span>↗</span></Link></Reveal><Reveal className="story-visual"><StoryGraphic type="connect" /></Reveal></section>
        <section className="story-section"><Reveal className="story-copy"><div className="story-index">03</div><div className="eyebrow">Acquire</div><h2>Choose the rights that fit your purpose.</h2><p>Make an offer, purchase an idea, or license the opportunity with terms everyone can understand.</p><Link to="/offers" className="text-link">See active offers <span>↗</span></Link></Reveal><Reveal className="story-visual"><StoryGraphic type="acquire" /></Reveal></section>
        <section className="story-section story-reverse"><Reveal className="story-copy"><div className="story-index">04</div><div className="eyebrow">Build</div><h2>Take the idea forward.</h2><p>Access what the agreement includes, preserve the history, and turn a possibility into progress.</p><Link to="/dashboard/company" className="text-link">Enter your workspace <span>↗</span></Link></Reveal><Reveal className="story-visual"><StoryGraphic type="build" /></Reveal></section>

        <section className="marketplace-showcase"><Reveal><div className="eyebrow">Featured marketplace</div><h2>Ideas with somewhere to go.</h2><p>Start with a clear signal. Go deeper when the opportunity feels right.</p></Reveal><div className="showcase-stage"><Link to="/idea/queue-system" className="showcase-idea idea-primary"><span className="showcase-number">01</span><span className="showcase-category">Campus Technology</span><strong>Smart Queue<br />System</strong><span className="showcase-meta">Concept <b>₹12,000</b></span></Link><Link to="/idea/inventory-assistant" className="showcase-idea idea-secondary"><span className="showcase-number">02</span><span className="showcase-category">Retail</span><strong>Inventory<br />Assistant</strong><span className="showcase-meta">Early validation <b>₹18,000</b></span></Link><Link to="/idea/research-match" className="showcase-idea idea-tertiary"><span className="showcase-number">03</span><span className="showcase-category">Education / SaaS</span><strong>Research<br />Match Engine</strong><span className="showcase-meta">Prototype <b>₹15,000</b></span></Link></div></section>

        <section className="premium-cta"><div className="eyebrow">Begin anywhere</div><h2>There is more than one way<br /><em>to move an idea forward.</em></h2><div className="hero-actions"><Link to="/explore" className="primary-button large">Explore Ideas</Link><Link to="/submit" className="secondary-button large">Submit an Idea</Link></div></section>
      </main>
    </>
  )
}

export function LegacyHomePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      {loading && (
        <div className="loading-screen" aria-live="polite" aria-label="Loading ENDLESS">
          <BrandMark />
          <span className="loading-word">ENDLESS</span>
        </div>
      )}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">Ideas marketplace</div>
            <h1>An idea can become something bigger.</h1>
            <p>ENDLESS gives promising ideas a place to be discovered, evaluated, and moved forward by the right people.</p>
            <div className="hero-actions">
              <Link to="/explore" className="primary-button large">Explore Ideas</Link>
              <Link to="/submit" className="secondary-button large">Submit an Idea</Link>
            </div>
          </div>
          <div className="hero-visual" aria-label="Featured marketplace ideas">
            <div className="floating-card card-one"><div className="card-topline"><div><div className="small-label">Featured idea</div><h3>Smart Queue System for Campus Cafeterias</h3></div><span className="state-badge">Concept</span></div><div className="card-meta"><span>Ayesha K.</span><strong>₹12,000</strong></div><Link to="/idea/queue-system" className="card-button">View Idea</Link></div>
            <div className="floating-card card-two"><div className="card-topline"><div><div className="small-label">Featured idea</div><h3>Inventory Assistant for Small Retail Stores</h3></div><span className="state-badge">Retail</span></div><div className="card-meta"><span>Mark R.</span><strong>₹18,000</strong></div><Link to="/idea/inventory-assistant" className="card-button">View Idea</Link></div>
            <div className="mini-panel"><div className="mini-label">Platform activity</div><div className="mini-value">694 ideas</div><div className="mini-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></div></div>
          </div>
        </section>
        <section className="stats-strip" aria-label="Marketplace overview"><div className="stat-item"><strong>150+</strong><span>Ideas listed</span></div><div className="stat-item"><strong>48</strong><span>Creators</span></div><div className="stat-item"><strong>26</strong><span>Companies</span></div><div className="stat-item"><strong>₹4.8L</strong><span>Opportunity value</span></div></section>
        <section className="home-section"><div className="eyebrow">Featured ideas</div><div className="section-heading"><h2>Find the signal inside the next big opportunity.</h2><Link to="/explore" className="secondary-button small">View marketplace</Link></div><div className="idea-grid compact-grid">{ideaListings.slice(0, 3).map((idea) => <article className="idea-card" key={idea.id}><div className="idea-top"><div className="creator-wrap"><div className="avatar">{idea.initials}</div><div><span className="creator-name">{idea.creator}</span><span className="meta-line">{idea.category}</span></div></div><span className="stage-pill">{idea.stage}</span></div><h3>{idea.title}</h3><p className="idea-summary">A structured concept with a clear problem, audience, and path to commercial value.</p><div className="idea-footer"><strong className="price">{idea.price}</strong><Link to={`/idea/${idea.id}`} className="secondary-button small">View Idea</Link></div></article>)}</div></section>
        <section className="home-section"><div className="eyebrow">How ENDLESS works</div><h2>From idea to opportunity in four clear stages.</h2><div className="steps-grid">{steps.map((step) => <div className="step-card" key={step.number}><div className="step-number">{step.number}</div><h3>{step.title}</h3><p>{step.text}</p></div>)}</div></section>
        <section className="split-section home-section"><div className="panel"><div className="eyebrow">For creators</div><h3>Make your thinking discoverable.</h3><p className="bio">Turn a promising concept into a clear listing, set the commercial terms, and connect with people who can help take it further.</p><Link to="/submit" className="primary-button">Submit an Idea</Link></div><div className="panel"><div className="eyebrow">For companies</div><h3>Find ideas worth building.</h3><p className="bio">Search across industries, talk directly with creators, and manage purchases, licenses, and offers from one workspace.</p><Link to="/companies" className="secondary-button">Explore for Companies</Link></div></section>
        <section className="home-cta"><div><div className="eyebrow">Start with what could be next</div><h2>Ideas have no limits.</h2></div><Link to="/explore" className="primary-button large">Explore Ideas</Link></section>
      </main>
    </>
  )

  /*
  return (
    <>
      {loading && (
        <div className="loading-screen" aria-live="polite" aria-label="Loading ENDLESS">
          <BrandMark />
          <span className="loading-word">ENDLESS</span>
        </div>
      )}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">Ideas marketplace</div>
            <h1>An idea can become something bigger.</h1>
            <p>
              Discover original ideas, connect with the people behind them, and find opportunities to build what comes next.
            </p>
            <div className="hero-actions">
              <Link to="/explore" className="primary-button large">Explore Ideas</Link>
              <Link to="/submit" className="secondary-button large">Submit an Idea</Link>
            </div>

            <div className="search-row" aria-label="Search ideas">
              <span className="search-placeholder">Search ideas, industries, problems…</span>
              <button type="button" className="ghost-button">Search</button>
            </div>

            <div className="suggestions" aria-label="Popular search suggestions">
              {searchSuggestions.map((item) => (
                <span key={item} className="pill">{item}</span>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="Marketplace preview">
            <div className="floating-card card-one">
              <div className="card-topline">
                <div>
                  <div className="small-label">Smart Queue System</div>
                  <h3>for Campus Cafeterias</h3>
                </div>
                <span className="state-badge">Campus</span>
              </div>
              <div className="card-meta">
                <span>Concept</span>
                <strong>₹12,000</strong>
              </div>
              <Link to="/idea/inventory-assistant" className="card-button">View Idea</Link>
            </div>

            <div className="floating-card card-two">
              <div className="card-topline">
                <div>
                  <div className="small-label">Inventory Assistant</div>
                  <h3>for Small Retail Stores</h3>
                </div>
                <span className="state-badge">Retail</span>
              </div>
              <div className="card-meta">
                <span>Early Validation</span>
                <strong>₹18,000</strong>
              </div>
              <Link to="/idea/inventory-assistant" className="card-button">View Idea</Link>
            </div>

            <div className="mini-panel">
              <div className="mini-label">Platform activity</div>
              <div className="mini-value">694 ideas</div>
              <div className="mini-bars" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-strip" aria-label="Marketplace overview">
          <div className="stat-item">
            <strong>150+</strong>
            <span>Ideas listed</span>
          </div>
          <div className="stat-item">
            <strong>48</strong>
            <span>Creators</span>
          </div>
          <div className="stat-item">
            <strong>26</strong>
            <span>Companies</span>
          </div>
          <div className="stat-item">
            <strong>₹4.8L</strong>
            <span>Opportunity value</span>
          </div>
        </section>

        <section className="marketplace-section" id="explore">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Explore Ideas</div>
              <h2>Find ideas across industries, problems and emerging opportunities.</h2>
            </div>
            <div className="search-box" aria-label="Search marketplace">
              <span className="search-icon">⌕</span>
              <input type="text" placeholder="Search ideas, industries, problems…" />
            </div>
          </div>

          <div className="marketplace-layout">
            <aside className="filter-panel" aria-label="Marketplace filters">
              {filterGroups.map((group) => (
                <div className="filter-group" key={group.title}>
                  <h4>{group.title}</h4>
                  <div className="filter-list">
                    {group.items.map((item) => (
                      <button key={item} type="button" className={item === 'All' || item === 'Any' ? 'is-active' : ''}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            <div className="idea-grid">
              {ideaListings.map((idea) => (
                <article className="idea-card" key={idea.id}>
                  <div className="idea-top">
                    <div className="creator-wrap">
                      <div className="avatar">{idea.initials}</div>
                      <div>
                        <span className="creator-name">{idea.creator}</span>
                        <span className="meta-line">{idea.category}</span>
                      </div>
                    </div>
                    <SaveIdeaButton idea={idea} />
                  </div>

                  <h3>{idea.title}</h3>
                  <p className="idea-summary">
                    A practical concept designed to improve operations, reduce friction, and create measurable value in real-world workflows.
                  </p>

                  <div className="idea-bottom">
                    <div>
                      <span className="meta-line">Asking price</span>
                      <strong className="price">{idea.price}</strong>
                    </div>
                    <div className="meta-stack">
                      <span>{idea.interest}</span>
                      <span>{idea.views}</span>
                    </div>
                  </div>

                  <div className="idea-footer">
                    <span className="stage-pill">{idea.stage}</span>
                    <Link to={`/idea/${idea.id}`} className="secondary-button small">View Idea</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="steps-section" id="how-it-works">
          <div className="eyebrow">How it works</div>
          <h2>From idea to opportunity in four clear steps.</h2>

          <div className="steps-grid">
            {steps.map((step) => (
              <div className="step-card" key={step.number}>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <div className="detail-copy">
            <div className="eyebrow">Idea detail</div>
            <h2>Inventory Assistant for Small Retail Stores</h2>
            <p className="detail-summary">
              A lightweight, practical system for small retailers that need better stock visibility, replenishment planning, and fewer costly stockouts.
            </p>

            <div className="info-grid">
              <div>
                <span className="mini-label">Category</span>
                <strong>Retail</strong>
              </div>
              <div>
                <span className="mini-label">Industry</span>
                <strong>Retail</strong>
              </div>
              <div>
                <span className="mini-label">Target users</span>
                <strong>Independent store owners</strong>
              </div>
              <div>
                <span className="mini-label">Creator</span>
                <strong>Mark R.</strong>
              </div>
            </div>

            <div className="content-block">
              <h3>Problem</h3>
              <p>Small shops often rely on manual tracking, which leads to missed sales, over-ordering, and unnecessary spoilage.</p>
            </div>

            <div className="content-block">
              <h3>General concept</h3>
              <p>A simple planning assistant that tracks stock movement, flags low inventory risks, and recommends replenishment timing based on store patterns.</p>
            </div>

            <div className="metrics-row">
              {detailMetrics.map((item) => (
                <div className="metric-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <aside className="locked-panel" aria-label="Protected idea details">
            <div className="lock-header">FULL IDEA DETAILS</div>
            <div className="lock-tag">Locked</div>
            <p>
              Detailed implementation information is available after purchase or approved access.
            </p>

            <div className="purchase-summary">
              <div><span>Creator</span><strong>Mark R.</strong></div>
              <div><span>Price</span><strong>₹18,000</strong></div>
              <div><span>Rights</span><strong>Transferable</strong></div>
            </div>

            <button type="button" className="primary-button wide">Unlock Full Idea</button>
            <button type="button" className="secondary-button wide">Chat with Creator</button>
          </aside>
        </section>

        <section className="split-section">
          <div className="panel creator-panel" id="creators">
            <div className="panel-head">
              <div className="profile-wrap">
                <div className="avatar large-avatar">MR</div>
                <div>
                  <h3>Mark Reynolds</h3>
                  <p>Product thinker · retail systems</p>
                </div>
              </div>
              <button type="button" className="secondary-button small">Follow</button>
            </div>

            <p className="bio">
              I build useful operational tools for small businesses and focus on practical, repeatable systems that help teams make better decisions.
            </p>

            <div className="tag-list">
              <span>Product strategy</span>
              <span>Operations</span>
              <span>Retail systems</span>
              <span>UX</span>
            </div>

            <div className="profile-stats">
              <div>
                <strong>18</strong>
                <span>Ideas published</span>
              </div>
              <div>
                <strong>7</strong>
                <span>Ideas sold</span>
              </div>
              <div>
                <strong>₹2.9L</strong>
                <span>Value generated</span>
              </div>
            </div>
          </div>

          <div className="panel company-panel" id="for-companies">
            <div className="eyebrow">Company dashboard</div>
            <h3>Find ideas worth building.</h3>
            <div className="company-grid">
              {companyStats.map((item) => (
                <div className="mini-stat" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="submit-section">
          <div className="eyebrow">Submit an idea</div>
          <h2>Publish with structure, trust and clarity.</h2>

          <div className="submit-flow">
            <div className="flow-step active">
              <span>Step 1</span>
              <h3>Basic Information</h3>
              <p>Title, category, industry, short summary.</p>
            </div>
            <div className="flow-step">
              <span>Step 2</span>
              <h3>Idea Details</h3>
              <p>Problem, target users, solution, why it matters.</p>
            </div>
            <div className="flow-step">
              <span>Step 3</span>
              <h3>Value</h3>
              <p>Asking price, stage, rights and offer settings.</p>
            </div>
            <div className="flow-step">
              <span>Step 4</span>
              <h3>Protection</h3>
              <p>Ownership declaration and supporting documents.</p>
            </div>
            <div className="flow-step">
              <span>Step 5</span>
              <h3>Review</h3>
              <p>Preview the public teaser and protected details.</p>
            </div>
          </div>
        </section>

        <section className="resale-section">
          <div className="resale-copy">
            <div className="eyebrow">Resale / transfer</div>
            <h2>Rights stay transparent and trackable.</h2>
            <div className="resale-card">
              <div className="resale-head">
                <span className="state-badge">Transferable</span>
                <strong>Transfer / Resell Idea</strong>
              </div>
              <div className="resale-metrics">
                <div>
                  <span>Original Purchase</span>
                  <strong>₹18,000</strong>
                </div>
                <div>
                  <span>Current Asking Price</span>
                  <strong>₹25,000</strong>
                </div>
                <div>
                  <span>Creator Royalty</span>
                  <strong>10%</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="timeline-panel">
            <h3>Ownership history</h3>
            <div className="timeline">
              {timeline.map((entry, index) => (
                <div className="timeline-item" key={entry.label}>
                  <span className="dot" aria-hidden="true"></span>
                  <div>
                    <p>{entry.label}</p>
                    <strong>{entry.value}</strong>
                  </div>
                  {index < timeline.length - 1 && <span className="timeline-line" aria-hidden="true"></span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="chat-section">
          <div className="section-heading compact-heading">
            <div>
              <div className="eyebrow">Chat with creator</div>
              <h2>Professional buyer conversations.</h2>
            </div>
            <button type="button" className="secondary-button small">New Offer</button>
          </div>

          <div className="chat-layout">
            <aside className="conversation-list">
              <div className="conversation active">
                <div>
                  <strong>Northstar Labs</strong>
                  <span>Purchase discussion</span>
                </div>
                <small>2m ago</small>
              </div>
              <div className="conversation">
                <div>
                  <strong>Brightlane</strong>
                  <span>Licensing discussion</span>
                </div>
                <small>18m ago</small>
              </div>
            </aside>

            <div className="chat-window">
              <div className="chat-meta">
                <span>Chatting about</span>
                <strong>Inventory Assistant</strong>
                <small>₹18,000 · Transferable Rights</small>
              </div>

              <div className="message-thread">
                {messages.map((message) => (
                  <div key={message.text} className={`message ${message.from}`}>
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="warning-box">
                Do not share sensitive information outside the platform.
              </div>
            </div>

            <aside className="offer-panel">
              <h3>Offer / negotiation</h3>
              <div className="offer-card">
                <span>Purchase type</span>
                <strong>Exclusive License</strong>
                <span>Offer amount</span>
                <strong>₹15,000</strong>
              </div>
              <div className="offer-actions">
                <button type="button" className="primary-button small">Accept</button>
                <button type="button" className="secondary-button small">Counter Offer</button>
              </div>
            </aside>
          </div>
        </section>

        <section className="rights-section">
          <div className="eyebrow">Rights</div>
          <h2>Every listing explains the commercial terms.</h2>
          <div className="rights-grid">
            {rights.map((right) => (
              <div className="right-card" key={right}>
                <h3>{right}</h3>
                <p>
                  {right === 'Full Ownership' && 'Buyer receives the defined ownership rights, subject to the agreement and any resale permissions included at listing time.'}
                  {right === 'Exclusive License' && 'Buyer receives exclusive usage rights according to the agreement and the commercial boundaries set by the creator.'}
                  {right === 'Non-Exclusive License' && 'Creator retains ownership and may license the same idea to others under separate terms.'}
                  {right === 'Transferable Rights' && 'Buyer may transfer or resell the acquired rights only when the original agreement permits it.'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
  */
}

function ExplorePage() {
  const marketplaceIdeas = useMarketplaceIdeas()
  const [activeCategory, setActiveCategory] = useState('All Ideas')
  const [sort, setSort] = useState('Recently Added')
  const [query, setQuery] = useState('')
  const visibleIdeas = marketplaceIdeas.filter((idea) => {
    const matchesQuery = `${idea.title} ${idea.category} ${idea.creator}`.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = activeCategory === 'All Ideas' || idea.category.toLowerCase().includes(activeCategory.toLowerCase().replace(' & ', ' ')) || (activeCategory === 'Campus & Students' && idea.category.includes('Campus')) || (activeCategory === 'Education' && idea.category.includes('Education'))
    return matchesQuery && matchesCategory
  })

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="eyebrow">Marketplace</div>
        <h1>Explore Ideas</h1>
        <p>Find ideas across industries, problems and emerging opportunities.</p>
      </section>
      <section className="category-section">
        <div className="section-heading"><div><div className="eyebrow">Browse by category</div><h2>Start with a direction.</h2></div><span className="category-count">{categories.length} categories</span></div>
        <div className="category-grid">{categories.map(([slug, name, description, count]) => <Link to={`/category/${slug}`} className={`category-card ${activeCategory === name ? 'active' : ''}`} key={slug} onClick={() => setActiveCategory(name)}><span className="category-mark">{String(count).padStart(3, '0')}</span><strong>{name}</strong><p>{description}</p><span className="category-link">Explore <b>↗</b></span></Link>)}</div>
      </section>
      <section className="content-card listing-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Trending now</div>
            <h2>Fresh ideas from builders and operators.</h2>
          </div>
          <div className="search-box" aria-label="Search page">
            <span className="search-icon">⌕</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ideas, industries, problems…" />
          </div>
        </div>
        <div className="marketplace-controls"><span>{activeCategory}</span><label>Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option>Recently Added</option><option>Most Viewed</option><option>Community Interest</option></select></label></div>
        <div className="marketplace-layout explore-layout">
          <aside className="filter-panel" aria-label="Marketplace filters">
            {filterGroups.map((group) => <div className="filter-group" key={group.title}><h4>{group.title}</h4><div className="filter-list">{group.items.map((item) => <button key={item} type="button" onClick={() => group.title === 'Category' && setActiveCategory(item)} className={item === activeCategory || item === 'Any' ? 'is-active' : ''}>{item}</button>)}</div></div>)}
          </aside>
          <div className="idea-grid compact-grid">
            {visibleIdeas.map((idea) => (
            <article className="idea-card" key={idea.id}>
              <div className="idea-top">
                <div className="creator-wrap">
                  <div className="avatar">{idea.initials}</div>
                  <div>
                    <span className="creator-name">{idea.creator}</span>
                    <span className="meta-line">{idea.category}</span>
                  </div>
                </div>
                <SaveIdeaButton idea={idea} />
              </div>
              <h3>{idea.title}</h3>
              <div className="idea-bottom">
                <div>
                  <span className="meta-line">{idea.status === 'sold' ? 'Status' : 'Asking price'}</span>
                  <strong className={`price ${idea.status === 'sold' ? 'sold-price' : ''}`}>{ideaPrice(idea)}</strong>
                </div>
                <div className="meta-stack">
                  <span>{idea.interest}</span>
                  <span>{idea.views}</span>
                </div>
              </div>
              <div className="idea-footer">
                <IdeaStatusBadge idea={idea} />
                <Link to={`/idea/${idea.id}`} className="secondary-button small">View Idea</Link>
              </div>
            </article>
            ))}
            {visibleIdeas.length === 0 && <div className="empty-state"><strong>No ideas match this view yet.</strong><span>Try another category or search term.</span></div>}
          </div>
        </div>
      </section>
    </main>
  )
}

function CategoryPage() {
  const marketplaceIdeas = useMarketplaceIdeas()
  const { slug } = useParams()
  const category = categoryMap[slug]

  if (!category) return <NotFoundPage />

  const [, name, description, count, subcategories] = category
  const matchingIdeas = marketplaceIdeas.filter((idea) => idea.category.toLowerCase().includes(name.toLowerCase().split(' ')[0]) || (name === 'Campus & Students' && idea.category.includes('Campus')) || (name === 'Education' && idea.category.includes('Education')))

  return (
    <main className="page-shell">
      <section className="page-hero category-hero"><Link to="/explore" className="back-link">← All categories</Link><div className="eyebrow">Category / {name}</div><h1>{name}</h1><p>{description}</p><span className="category-count">{count} ideas in this category</span></section>
      <section className="category-subcategories"><div className="eyebrow">Subcategories</div><div className="subcategory-list">{subcategories.map((subcategory) => <button type="button" key={subcategory}>{subcategory}</button>)}</div></section>
      <section className="content-card listing-panel"><div className="section-heading"><div><div className="eyebrow">Latest in {name}</div><h2>Ideas to explore.</h2></div><Link to="/explore" className="secondary-button small">All ideas</Link></div><div className="idea-grid compact-grid">{matchingIdeas.map((idea) => <article className="idea-card" key={idea.id}><div className="idea-top"><div className="creator-wrap"><div className="avatar">{idea.initials}</div><div><span className="creator-name">{idea.creator}</span><span className="meta-line">{idea.category}</span></div></div><SaveIdeaButton idea={idea} /></div><h3>{idea.title}</h3><p className="idea-summary">{idea.teaser || description}</p><div className="idea-footer"><span className="stage-pill">{idea.stage}</span><Link to={`/idea/${idea.slug}`} className="secondary-button small">View Idea</Link></div></article>)}{!matchingIdeas.length && <div className="empty-state"><strong>No ideas in this category yet.</strong><Link to="/explore" className="secondary-button small">Browse all ideas</Link></div>}</div></section>
    </main>
  )
}

function IdeaDetailPage() {
  const marketplaceIdeas = useMarketplaceIdeas()
  const { user, isAuthenticated } = useAuth()
  const { id } = useParams()
  const [loadedIdea, setLoadedIdea] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [purchased, setPurchased] = useState(false)
  const [isCurrentOwner, setIsCurrentOwner] = useState(false)
  const idea = loadedIdea ?? marketplaceIdeas.find((item) => item.slug === id || item.id === id)
  const isSold = idea?.status === 'sold' || purchased

  useEffect(() => {
    let mounted = true
    // The loading/error state is intentionally reset here before the async lookup resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    setIsLoading(true)
    // oxlint-disable-next-line react/set-state-in-effect
    setLoadError('')
    loadIdeaBySlug(id).then(async ({ data, error }) => {
      if (!mounted) return
      if (error || !data) {
        setLoadError(error?.message ?? 'This idea could not be found.')
        setIsLoading(false)
        return
      }
      let nextIdea = data
      if (isAuthenticated) {
        const protectedResult = await loadProtectedIdea(data.id)
        if (protectedResult.data) nextIdea = { ...data, ...protectedResult.data }
      }
      setLoadedIdea({ ...nextIdea, creator: nextIdea.profiles?.name ?? 'ENDLESS creator', initials: (nextIdea.profiles?.name ?? 'EC').slice(0, 2).toUpperCase(), price: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(nextIdea.asking_price), rights_type: nextIdea.purchase_type })
      setIsLoading(false)
    })
    return () => { mounted = false }
  }, [id, isAuthenticated])

  useEffect(() => {
    if (!isSold || !user?.id) return undefined
    let mounted = true
    loadBuyerPurchases(user.id).then(({ data }) => {
      if (mounted) setIsCurrentOwner((data ?? []).some((purchase) => purchase.idea_id === idea.id))
    })
    return () => { mounted = false }
  }, [idea.id, isSold, user?.id])

  const handlePurchase = async () => {
    if (!isAuthenticated) return
    if (!idea.id) {
      setPurchaseError('This listing is not connected to the marketplace database yet.')
      return
    }
    setPurchaseError('')
    setIsPurchasing(true)
    const result = await purchaseIdea(idea.id)
    setIsPurchasing(false)
    if (result.alreadySold) {
      setPurchased(true)
      return
    }
    if (result.error) {
      setPurchaseError(result.error.message)
      return
    }
    setPurchased(true)
  }

  if (isLoading) return <main className="auth-state" aria-live="polite">Loading idea…</main>
  if (loadError || !idea) return <main className="page-shell"><section className="content-card empty-state"><strong>{loadError || 'This idea could not be found.'}</strong><Link to="/explore" className="secondary-button">Back to Explore</Link></section></main>

  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero">
        <div className="eyebrow">Idea detail {isSold && <span className="state-badge sold-badge">SOLD</span>}</div>
        <h1>{idea.title}</h1>
        <p>A practical idea for small retailers who need faster inventory decisions, clearer stock visibility, and lower operational risk.</p>
        <div className="idea-byline"><Link to="/creator/mark-reynolds" className="creator-name">Mark Reynolds</Link><span>Retail · Early Validation · 18 Aug 2026</span></div>
      </section>

      <section className="detail-layout">
        <div className="content-card">
          <div className="info-grid">
            <div>
              <span className="mini-label">Category</span>
              <strong>Retail</strong>
            </div>
            <div>
              <span className="mini-label">Stage</span>
              <strong>Early Validation</strong>
            </div>
            <div>
              <span className="mini-label">Creator</span>
              <strong>Mark R.</strong>
            </div>
            <div>
              <span className="mini-label">Price</span>
              <strong>{ideaPrice(idea)}</strong>
            </div>
            <div>
              <span className="mini-label">Industry</span>
              <strong>Retail</strong>
            </div>
            <div>
              <span className="mini-label">Target users</span>
              <strong>Independent store owners</strong>
            </div>
          </div>

          <div className="content-block">
            <div className="editorial-kicker">Public information</div>
            <h3>The problem</h3>
            <p>Independent retailers lose time and margin when ordering decisions are based on intuition instead of near-real-time demand signals.</p>
          </div>

          <div className="content-block">
            <h3>The concept</h3>
            <p>The idea combines simple inventory scanning, demand forecasting, and replenishment recommendations into a single lightweight operating layer that helps teams stay ahead of shortages and overstock.</p>
          </div>

          <div className="content-block">
            <h3>The opportunity</h3>
            <p>Small retailers need operational tools that are easier to adopt than enterprise systems and more dependable than spreadsheets. The public teaser points to a practical wedge into that underserved workflow.</p>
          </div>

          <div className="metrics-row">
            {detailMetrics.map((item) => (
              <div className="metric-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="content-block rights-summary">
            <h3>Rights available</h3>
            <div className="tag-list">{rights.map((right) => <span key={right}>{right}</span>)}</div>
          </div>
        </div>

        <aside className="locked-panel sticky-panel">
          <div className="locked-document" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <div className="lock-header">FULL IDEA DETAILS</div>
          <div className="lock-tag">{isSold ? 'SOLD' : 'Locked'}</div>
          <p>{isSold ? 'This idea has already been sold.' : 'Some ideas are meant to be discovered. The complete story is unlocked with access.'}</p>
          <p className="protected-note">Detailed implementation information is available after purchase or approved access.</p>
          <div className="purchase-summary">
            <div><span>Creator</span><strong>Mark R.</strong></div>
            <div><span>{isSold ? 'Status' : 'Asking price'}</span><strong>{ideaPrice(idea)}</strong></div>
            <div><span>Purchase type</span><strong>Transferable Rights</strong></div>
            <div><span>Rights included</span><strong>Agreement-defined</strong></div>
          </div>
          {purchaseError && <div className="form-error" role="alert">{purchaseError}</div>}
          <div className="detail-actions">
            <Link to="/messages" className="secondary-button wide">Chat with Creator</Link>
            {!isSold && <Link to="/offers" className="secondary-button wide">Make an Offer</Link>}
            {!isSold && (isAuthenticated ? <button type="button" className="primary-button wide" onClick={handlePurchase} disabled={isPurchasing}>{isPurchasing ? 'Purchasing…' : 'Unlock Full Idea'}</button> : <Link to={`/login?redirect=/idea/${idea.id}`} className="primary-button wide">Unlock Full Idea</Link>)}
          </div>
          {isSold && isCurrentOwner && idea.allows_transfer_resale && <Link to="/transfer" className="secondary-button wide">Transfer / Resell</Link>}
          <p className="rights-disclaimer">Rights are determined by the agreement between the creator and buyer. Platform records do not automatically establish legal ownership.</p>
        </aside>
      </section>
    </main>
  )
}

function SubmitPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return setStatus({ type: 'error', message: 'Add a title before publishing.' })
    setIsSubmitting(true)
    const result = await createIdea({
      creator_id: user.id,
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`,
      title,
      teaser: String(form.get('teaser') ?? '').trim(),
      public_description: String(form.get('teaser') ?? '').trim(),
      protected_details: String(form.get('protected_details') ?? '').trim(),
      category: String(form.get('category') ?? ''),
      industry: String(form.get('industry') ?? ''),
      stage: String(form.get('stage') ?? 'Concept'),
      asking_price: Number(form.get('asking_price') ?? 0),
      purchase_type: String(form.get('purchase_type') ?? 'Full Ownership'),
    })
    setIsSubmitting(false)
    if (result.error) return setStatus({ type: 'error', message: result.error.message })
    event.currentTarget.reset()
    setStatus({ type: 'success', message: 'Your idea has been published.' })
  }

  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero">
        <div className="eyebrow">Submit an idea</div>
        <h1>Publish a clear, credible, and valuable listing.</h1>
        <p>Structure your idea for discovery, trust, and negotiation with a guided submission flow.</p>
      </section>

      <section className="content-card form-card">
        <div className="submit-flow stacked-flow">
          <div className="flow-step active">
            <span>Step 1</span>
            <h3>Basic Information</h3>
            <p>Title, category, industry, summary, and target user.</p>
          </div>
          <div className="flow-step">
            <span>Step 2</span>
            <h3>Problem & Solution</h3>
            <p>Articulate the problem, user pain, and value proposition.</p>
          </div>
          <div className="flow-step">
            <span>Step 3</span>
            <h3>Commercial Terms</h3>
            <p>Set stage, rights, asking price, and preferred sales format.</p>
          </div>
        </div>

        {status.message && <div className={status.type === 'error' ? 'form-error' : 'form-success'} role="status">{status.message}</div>}
        <form id="submit-idea-form" className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Idea title</span>
            <input name="title" type="text" placeholder="Name the idea" required />
          </label>
          <label>
            <span>Main category</span>
            <select name="category" defaultValue="retail">{categories.map(([slug, name]) => <option value={name} key={slug}>{name}</option>)}</select>
          </label>
          <label>
            <span>Subcategory</span>
            <select defaultValue="Inventory Solutions"><option>Inventory Solutions</option><option>Retail Technology</option><option>Productivity Tools</option><option>Marketplace Ideas</option></select>
          </label>
          <label>
            <span>Industry</span>
            <select name="industry" defaultValue="Retail"><option>Retail</option><option>Education</option><option>Healthcare</option><option>Food & Restaurants</option><option>Fashion</option><option>Business</option></select>
          </label>
          <label>
            <span>Idea stage</span>
            <select name="stage" defaultValue="Concept"><option>Concept</option><option>Prototype</option><option>Early Validation</option><option>Launch Ready</option></select>
          </label>
          <label>
            <span>Asking price</span>
            <input name="asking_price" type="number" min="0" step="1" placeholder="0" required />
          </label>
          <label>
            <span>Purchase type</span>
            <select name="purchase_type" defaultValue="Full Ownership"><option>Full Ownership</option><option>Exclusive License</option><option>Non-Exclusive License</option><option>Transferable Rights</option></select>
          </label>
          <label className="full-width">
            <span>Short summary</span>
            <textarea name="teaser" rows="4" required />
          </label>
          <label className="full-width">
            <span>Protected details</span>
            <textarea name="protected_details" rows="4" required />
          </label>
        </form>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => setStatus({ type: 'success', message: 'Drafts are not enabled yet.' })}>Save Draft</button>
          <button type="submit" form="submit-idea-form" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Publishing…' : 'Publish Listing'}</button>
        </div>
        <p className="form-privacy-note">By submitting an idea, you understand that the information you provide is used to create and manage your listing. Read the <Link to="/privacy">Privacy Policy</Link>.</p>
      </section>
    </main>
  )
}

function CreatorsPage() {
  const marketplaceIdeas = useMarketplaceIdeas()
  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="eyebrow">Creators</div>
        <h1>Build a portfolio of ideas, traction, and trust.</h1>
        <p>Track product thinking, inventory of ideas, and buyer conversations from one place.</p>
      </section>
      <section className="content-card cards-stack">
        <div className="creator-listing">
          <div className="profile-wrap">
            <div className="avatar large-avatar">MR</div>
            <div>
              <h3>Mark Reynolds</h3>
              <p>Retail systems · product strategy</p>
            </div>
          </div>
          <div className="profile-stats compact-stats">
            <div><strong>18</strong><span>Ideas</span></div>
            <div><strong>7</strong><span>Sold</span></div>
            <div><strong>₹2.9L</strong><span>Value</span></div>
          </div>
        </div>
        <div className="idea-grid compact-grid">
          {marketplaceIdeas.slice(0, 2).map((idea) => (
            <article className="idea-card" key={idea.id}>
              <h3>{idea.title}</h3>
              <div className="idea-bottom">
                <div>
                  <span className="meta-line">Asking price</span>
                  <strong className="price">{ideaPrice(idea)}</strong>
                </div>
                <div className="meta-stack">
                  <span>{idea.interest}</span>
                  <span>{idea.views}</span>
                </div>
              </div>
              <div className="idea-footer">
                <IdeaStatusBadge idea={idea} />
                <Link to={`/idea/${idea.id}`} className="secondary-button small">View</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function CreatorProfilePage() {
  const marketplaceIdeas = useMarketplaceIdeas()
  return (
    <main className="page-shell">
      <section className="profile-hero">
        <div className="avatar profile-avatar">MR</div>
        <div><div className="eyebrow">Creator profile</div><h1>Mark Reynolds</h1><p>Product thinker focused on practical retail systems, operational clarity, and useful tools for independent businesses.</p><div className="tag-list"><span>Product strategy</span><span>Operations</span><span>Retail systems</span><span>UX</span></div></div>
      </section>
      <section className="profile-overview"><div><strong>18</strong><span>Ideas published</span></div><div><strong>7</strong><span>Ideas sold</span></div><div><strong>₹2.9L</strong><span>Value generated</span></div><div><strong>2024</strong><span>Joined ENDLESS</span></div></section>
      <section className="content-card listing-panel"><div className="eyebrow">Published ideas</div><h2>Work worth exploring.</h2><div className="idea-grid compact-grid">{marketplaceIdeas.slice(0, 3).map((idea) => <article className="idea-card" key={idea.id}><h3>{idea.title}</h3><p className="idea-summary">A public teaser from Mark’s portfolio of practical product opportunities.</p><div className="idea-footer"><IdeaStatusBadge idea={idea} /><Link to={`/idea/${idea.id}`} className="secondary-button small">View Idea</Link></div></article>)}</div></section>
      <section className="activity-strip"><div className="eyebrow">Recent activity</div><p><strong>12 Aug 2026</strong> · Inventory Assistant received a new offer from Northstar Labs.</p><p><strong>04 Aug 2026</strong> · Smart Queue System reached early validation.</p></section>
    </main>
  )
}

function CompaniesPage() {
  const marketplaceIdeas = useMarketplaceIdeas()
  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="eyebrow">For companies</div>
        <h1>Source product opportunities with more signal and less noise.</h1>
        <p>Track saved ideas, open offers, rights, and active deals in a workspace built for discovery and diligence.</p>
      </section>
      <section className="content-card dashboard-grid">
        {companyStats.map((item) => (
          <div className="mini-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>
      <section className="content-card listing-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Priority matching</div>
            <h2>Ideas aligned to your strategy.</h2>
          </div>
        </div>
        <div className="idea-grid compact-grid">
          {marketplaceIdeas.map((idea) => (
            <article className="idea-card" key={idea.id}>
              <h3>{idea.title}</h3>
              <p className="idea-summary">High-value concept with strong operational relevance and clear commercial upside.</p>
              <div className="idea-footer">
                <IdeaStatusBadge idea={idea} />
                <Link to={`/idea/${idea.id}`} className="secondary-button small">Review</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function CompanyDashboardPage() {
  const { user } = useAuth()
  const [saved, setSaved] = useState([])
  const [purchases, setPurchases] = useState([])
  const [offers, setOffers] = useState([])
  const [licenses, setLicenses] = useState([])
  useEffect(() => {
    loadSavedIdeas(user?.id).then(({ data }) => setSaved(data ?? []))
    loadBuyerPurchases(user?.id).then(({ data }) => setPurchases(data ?? []))
    loadOffers(user?.id).then(({ data }) => setOffers(data ?? []))
    loadLicenses(user?.id).then(({ data }) => setLicenses(data ?? []))
  }, [user?.id])
  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero"><div className="eyebrow">Company workspace</div><h1>Make the next move with context.</h1><p>Review saved ideas, active licenses, open offers, and recent conversations from one focused workspace.</p></section>
      <section className="dashboard-grid"><div className="mini-stat"><span>Saved Ideas</span><strong>{saved.length}</strong></div><div className="mini-stat"><span>Purchased Ideas</span><strong>{purchases.length}</strong></div><div className="mini-stat"><span>Active Licenses</span><strong>{licenses.filter((license) => license.status === 'active').length}</strong></div><div className="mini-stat"><span>Open Offers</span><strong>{offers.filter((offer) => offer.status === 'pending').length}</strong></div></section>
      <section className="dashboard-columns"><div className="content-card"><div className="eyebrow">Recent activity</div><div className="activity-list">{[...purchases.slice(0, 2).map((item) => [item.ideas?.title, 'Purchased']), ...offers.slice(0, 2).map((item) => [item.ideas?.title, `Offer ${item.status}`])].map(([title, detail]) => <p key={`${title}-${detail}`}><strong>{title ?? 'Marketplace activity'}</strong><span>{detail}</span></p>)}{!purchases.length && !offers.length && <div className="empty-state"><strong>No activity yet.</strong><span>Saved ideas, offers, and purchases will appear here.</span></div>}</div></div><div className="content-card"><div className="eyebrow">Next action</div><h3>Review your marketplace activity.</h3><p className="idea-summary">Keep offers, purchased ideas, messages, and licenses moving from one workspace.</p><Link to="/offers" className="primary-button">Open Offers</Link></div></section>
      <nav className="workspace-nav" aria-label="Company dashboard sections"><Link to="/explore">Discover</Link><Link to="/saved">Saved</Link><Link to="/dashboard/purchased">Purchased</Link><Link to="/dashboard/licenses">Licenses</Link><Link to="/offers">Offers</Link><Link to="/messages">Messages</Link><Link to="/transactions">Transactions</Link></nav>
    </main>
  )
}

function HowItWorksPage() {
  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero">
        <div className="eyebrow">How it works</div>
        <h1>From idea to execution in four guided steps.</h1>
        <p>ENDLESS helps creators package a concept, companies evaluate it, and both sides move through transparent commercial conversations.</p>
      </section>
      <section className="content-card">
        <div className="steps-grid">
          {steps.map((step) => (
            <div className="step-card" key={step.number}>
              <div className="step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function MessagesPage() {
  const { user } = useAuth()
  const [messagesData, setMessagesData] = useState([])
  const [profiles, setProfiles] = useState([])
  const [recipientId, setRecipientId] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    loadMessages(user?.id).then(({ data }) => setMessagesData(data ?? []))
    loadProfiles().then(({ data }) => setProfiles((data ?? []).filter((profile) => profile.id !== user?.id)))
  }, [user?.id])
  const send = async (event) => {
    event.preventDefault()
    if (!recipientId || !body.trim()) return setError('Choose a recipient and write a message.')
    const result = await sendMessage({ senderId: user.id, recipientId, body: body.trim() })
    if (result.error) return setError(result.error.message)
    setMessagesData((current) => [...current, result.data])
    setBody('')
    setError('')
  }
  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero">
        <div className="eyebrow">Workspace</div>
        <h1>Conversations that move ideas forward.</h1>
        <p>Keep purchase discussions, offers, rights questions, and document requests in one professional thread.</p>
      </section>
      <section className="chat-layout product-chat-layout">
        <aside className="conversation-list">
          <div className="conversation active"><div><strong>Northstar Labs</strong><span>Inventory Assistant</span></div><small>2m ago</small></div>
          <div className="conversation"><div><strong>Brightlane</strong><span>Clinic scheduling</span></div><small>18m ago</small></div>
          <div className="conversation"><div><strong>Ayesha K.</strong><span>Queue system</span></div><small>Yesterday</small></div>
        </aside>
        <div className="chat-window">
          <div className="chat-meta"><span>Purchase discussion</span><strong>Inventory Assistant</strong><small>Northstar Labs · ₹18,000</small></div>
          <div className="message-thread">{messagesData.map((message) => <div key={message.id} className={`message ${message.sender_id === user?.id ? 'creator' : 'company'}`}>{message.body}</div>)}{!messagesData.length && <div className="empty-state"><strong>No messages yet.</strong><span>Start a marketplace conversation.</span></div>}</div>
          <form className="message-composer" onSubmit={send}><select value={recipientId} onChange={(event) => setRecipientId(event.target.value)} aria-label="Message recipient"><option value="">Recipient</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select><input type="text" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message…" /><button type="submit" className="primary-button small">Send</button></form>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="warning-box">Keep sensitive information and payments inside ENDLESS.</div>
        </div>
        <aside className="offer-panel">
          <h3>Idea information</h3>
          <div className="offer-card"><span>Rights type</span><strong>Transferable Rights</strong><span>Status</span><strong>Open discussion</strong></div>
          <Link to="/offers" className="secondary-button wide">View offer</Link>
          <Link to="/idea/inventory-assistant" className="secondary-button wide">Open idea</Link>
        </aside>
      </section>
    </main>
  )
}

function OffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [ideas, setIdeas] = useState([])
  const [form, setForm] = useState({ ideaId: '', amount: '', purchaseType: 'Full Ownership', message: '' })
  const [feedback, setFeedback] = useState('')
  useEffect(() => {
    loadOffers(user?.id).then(({ data }) => setOffers(data ?? []))
    loadIdeas().then(({ data }) => setIdeas((data ?? []).filter((idea) => idea.status === 'available')))
  }, [user?.id])
  const submitOffer = async (event) => {
    event.preventDefault()
    const idea = ideas.find((item) => item.id === form.ideaId)
    if (!idea) return setFeedback('Choose an available idea.')
    const result = await createOffer({ ideaId: idea.id, creatorId: idea.creator_id, buyerId: user.id, amount: Number(form.amount), purchaseType: form.purchaseType, message: form.message })
    if (result.error) return setFeedback(result.error.message)
    setFeedback('Offer sent.')
    setForm({ ideaId: '', amount: '', purchaseType: 'Full Ownership', message: '' })
    loadOffers(user.id).then(({ data }) => setOffers(data ?? []))
  }
  const respond = async (offerId, status) => {
    const result = await updateOfferStatus(offerId, status)
    if (result.error) return setFeedback(result.error.message)
    setOffers((current) => current.map((offer) => offer.id === offerId ? { ...offer, status } : offer))
  }

  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero"><div className="eyebrow">Marketplace workspace</div><h1>Offers with clear terms and next steps.</h1><p>Review received, sent, pending, accepted, and countered proposals without losing the context around each idea.</p></section>
      <section className="content-card">
        {user?.accountType === 'company' && <form className="form-grid offer-form" onSubmit={submitOffer}><label><span>Idea</span><select value={form.ideaId} onChange={(event) => setForm({ ...form, ideaId: event.target.value })}><option value="">Select an idea</option>{ideas.map((idea) => <option value={idea.id} key={idea.id}>{idea.title}</option>)}</select></label><label><span>Offer amount</span><input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></label><label><span>Purchase type</span><select value={form.purchaseType} onChange={(event) => setForm({ ...form, purchaseType: event.target.value })}><option>Full Ownership</option><option>Exclusive License</option><option>Non-Exclusive License</option><option>Transferable Rights</option></select></label><label className="full-width"><span>Message</span><textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows="3" /></label><button className="primary-button" type="submit">Send Offer</button></form>}
        {feedback && <div className="form-success" role="status">{feedback}</div>}
        <div className="tab-row"><button type="button" className="tab active">All Offers</button><button type="button" className="tab">Received</button><button type="button" className="tab">Sent</button><button type="button" className="tab">Accepted</button></div>
        <div className="data-list">
          {offers.map((offer) => <article className="data-row" key={offer.id}><div><strong>{offer.ideas?.title ?? 'Idea offer'}</strong><span>{offer.buyer?.name ?? offer.creator?.name ?? 'Marketplace member'}</span></div><div><strong>₹{Number(offer.amount).toLocaleString('en-IN')}</strong><span>{offer.purchase_type}</span></div><span className="stage-pill">{offer.status}</span>{offer.creator_id === user?.id && offer.status === 'pending' && <div className="row-actions"><button type="button" className="secondary-button small" onClick={() => respond(offer.id, 'declined')}>Decline</button><button type="button" className="primary-button small" onClick={() => respond(offer.id, 'accepted')}>Accept</button></div>}</article>)}
          {!offers.length && <div className="empty-state"><strong>No offers yet.</strong><span>Offers you send or receive will appear here.</span></div>}
        </div>
      </section>
    </main>
  )
}

function PurchasedPage() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    loadBuyerPurchases(user?.id).then(({ data }) => setPurchases(data ?? []))
  }, [user?.id])

  const cards = purchases.length
    ? purchases.map((purchase) => [purchase.ideas?.title ?? 'Purchased idea', `Purchased ${new Date(purchase.purchased_at).toLocaleDateString()}`, purchase.rights_type])
    : [['No purchases yet', 'Purchased ideas will appear here after checkout.', 'Marketplace']]

  return <WorkspacePage eyebrow="Acquired ideas" title="Purchased ideas, ready when you are." text="Open acquired concepts, check access status, and manage the rights attached to every purchase." cards={cards} action="Open Purchased Idea" />
}

function LicensesPage() {
  const { user } = useAuth()
  const [licenses, setLicenses] = useState([])
  useEffect(() => { loadLicenses(user?.id).then(({ data }) => setLicenses(data ?? [])) }, [user?.id])
  const cards = licenses.map((license) => [license.ideas?.title ?? 'Licensed idea', `${license.purchase_type} · ${new Date(license.starts_at).toLocaleDateString()}`, license.status])
  return <WorkspacePage eyebrow="Rights management" title="Licenses with the important dates in view." text="Review active, expired, and transferable licenses and keep every commercial term easy to find." cards={cards} action="View License" />
}

function TransferPage() {
  return <main className="page-shell"><section className="page-hero narrow-hero"><div className="eyebrow">Ownership controls</div><h1>Transfer only when the agreement allows it.</h1><p>ENDLESS keeps the original creator, current owner, rights type, conditions, and transaction history visible before a transfer begins.</p></section><section className="content-card"><div className="transfer-grid"><div><span className="mini-label">Original creator</span><strong>Mark Reynolds</strong></div><div><span className="mini-label">Current owner</span><strong>Northstar Labs</strong></div><div><span className="mini-label">Rights type</span><strong>Transferable Rights</strong></div><div><span className="mini-label">Transfer conditions</span><strong>Creator royalty: 10%</strong></div></div><div className="timeline compact-timeline">{timeline.map((entry, index) => <div className="timeline-item" key={entry.label}><span className="dot"></span><div><p>{entry.label}</p><strong>{entry.value}</strong></div>{index < timeline.length - 1 && <span className="timeline-line"></span>}</div>)}</div><button type="button" className="primary-button">Transfer / List for Resale</button></section></main>
}

function SavedPage() {
  const { user } = useAuth()
  const [saved, setSaved] = useState([])
  useEffect(() => { loadSavedIdeas(user?.id).then(({ data }) => setSaved(data ?? [])) }, [user?.id])
  const cards = saved.map((entry) => [entry.ideas?.title ?? 'Saved idea', `${entry.ideas?.category ?? ''} · ${entry.ideas?.stage ?? ''}`, entry.ideas?.status ?? 'available'])
  return <WorkspacePage eyebrow="Shortlist" title="Saved ideas worth another look." text="Compare the basics, contact creators, and keep your strongest opportunities close." cards={cards} action="Open idea" />
}

function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  useEffect(() => { loadTransactions(user?.id).then(({ data }) => setTransactions(data ?? [])) }, [user?.id])
  return <main className="page-shell"><section className="page-hero narrow-hero"><div className="eyebrow">Activity ledger</div><h1>Every purchase, sale, and transfer in one record.</h1><p>Track amounts, transaction types, and statuses across the platform.</p></section><section className="content-card"><div className="data-list">{transactions.map((transaction) => <article className="data-row" key={transaction.id}><div><strong>{transaction.ideas?.title ?? 'Idea transaction'}</strong><span>{new Date(transaction.created_at).toLocaleDateString()}</span></div><div><strong>₹{Number(transaction.amount).toLocaleString('en-IN')}</strong><span>{transaction.type}</span></div><span className="stage-pill">{transaction.status}</span></article>)}{!transactions.length && <div className="empty-state"><strong>No transactions yet.</strong><span>Completed marketplace activity will appear here.</span></div>}</div></section></main>
}

function DashboardPage() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({ available: 0, under_offer: 0, sold: 0 })
  const [ideas, setIdeas] = useState([])
  const [offers, setOffers] = useState([])

  useEffect(() => {
    loadCreatorCounts(user?.id).then(({ data }) => { if (data) setCounts(data) })
    loadCreatorIdeas(user?.id).then(({ data }) => setIdeas(data ?? []))
    loadOffers(user?.id).then(({ data }) => setOffers(data ?? []))
  }, [user?.id])

  return <main className="page-shell"><section className="page-hero narrow-hero"><div className="eyebrow">Creator dashboard</div><h1>Your ideas, conversations, and earnings at a glance.</h1><p>Keep your listings moving and follow every opportunity from first view to completed transaction.</p></section><section className="dashboard-grid"><div className="mini-stat"><span>Available</span><strong>{counts.available}</strong></div><div className="mini-stat"><span>Under Offer</span><strong>{counts.under_offer}</strong></div><div className="mini-stat"><span>Sold</span><strong>{counts.sold}</strong></div></section><section className="content-card listing-panel"><div className="eyebrow">My ideas</div><div className="data-list">{ideas.map((idea) => <article className="data-row" key={idea.id}><div><strong>{idea.title}</strong><span>{idea.category} · {idea.stage}</span></div><div><strong>₹{Number(idea.asking_price).toLocaleString('en-IN')}</strong><span>{idea.status}</span></div><Link to={`/idea/${idea.slug}`} className="secondary-button small">View</Link></article>)}{!ideas.length && <div className="empty-state"><strong>No ideas published yet.</strong><Link to="/submit" className="secondary-button small">Submit an idea</Link></div>}</div></section><section className="content-card listing-panel"><div className="eyebrow">Offers</div><div className="data-list">{offers.slice(0, 5).map((offer) => <article className="data-row" key={offer.id}><div><strong>{offer.ideas?.title ?? 'Idea offer'}</strong><span>{offer.buyer?.name ?? 'Buyer'}</span></div><span className="stage-pill">{offer.status}</span></article>)}{!offers.length && <div className="empty-state"><strong>No offers yet.</strong></div>}</div></section></main>
}

function WorkspacePage({ eyebrow, title, text, cards, action }) {
  return <main className="page-shell"><section className="page-hero narrow-hero"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></section><section className="content-card workspace-list">{cards.map((card) => <article className="workspace-row" key={card[0]}><div><strong>{card[0]}</strong><span>{card[1]}</span></div><span className="stage-pill">{card[2]}</span><button type="button" className="secondary-button small">{action}</button></article>)}</section></main>
}

function SettingsPage() {
  return <main className="page-shell"><section className="page-hero narrow-hero"><div className="eyebrow">Account controls</div><h1>Settings that stay out of your way.</h1><p>Manage your profile, security, notifications, payment information, privacy, and marketplace preferences.</p></section><section className="content-card settings-layout"><aside className="settings-nav"><button type="button" className="active">Profile</button><button type="button">Account</button><button type="button">Security</button><button type="button">Notifications</button><button type="button">Payment Information</button><button type="button">Privacy</button><button type="button">Marketplace Preferences</button></aside><div className="form-grid settings-form"><label><span>Display name</span><input type="text" defaultValue="Mark Reynolds" /></label><label><span>Email</span><input type="email" defaultValue="mark@example.com" /></label><label className="full-width"><span>Bio</span><textarea defaultValue="Product thinker focused on practical retail systems." rows="4" /></label><div className="form-actions full-width"><button type="button" className="primary-button">Save changes</button></div></div></section></main>
}

function ProtectedRoute({ children, role }) {
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <main className="auth-state" aria-live="polite">Checking your ENDLESS session…</main>
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />
  if (role && user?.accountType !== role) return <Navigate to={user?.accountType === 'company' ? '/dashboard/company' : '/dashboard/creator'} replace />
  return children
}

function AuthPage({ title, heading, subtitle }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, user, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate(user?.accountType === 'company' ? '/dashboard/company' : '/dashboard/creator', { replace: true })
  }, [isAuthenticated, navigate, user?.accountType])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.')
    if (!password) return setError('Enter your password.')

    setIsSubmitting(true)
    const result = await signIn({ email: email.trim(), password })
    setIsSubmitting(false)
    if (result.error) return setError(result.error.message.includes('Invalid login credentials') ? 'Email or password is incorrect.' : result.error.message)

    const redirect = searchParams.get('redirect')
    navigate(redirect || (result.session?.user?.user_metadata?.account_type === 'company' ? '/dashboard/company' : user?.accountType === 'company' ? '/dashboard/company' : '/dashboard/creator'), { replace: true })
  }

  return (
    <main className="page-shell auth-shell">
      <section className="content-card auth-card">
        <BrandMark />
        <div className="eyebrow">{title}</div>
        <h1>{heading}</h1>
        <p>{subtitle}</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="form-grid simple-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••" />
          </label>
          <button type="submit" className="primary-button wide" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <div className="auth-links"><Link to="/forgot-password">Forgot Password</Link><Link to="/signup">Create Account</Link></div>
      </section>
    </main>
  )
}

function SignupPage() {
  const navigate = useNavigate()
  const { signUp, isAuthenticated } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', accountType: 'creator' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { if (isAuthenticated) navigate('/dashboard/creator', { replace: true }) }, [isAuthenticated, navigate])

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError('Complete every required field.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    setIsSubmitting(true)
    const result = await signUp(form)
    setIsSubmitting(false)
    if (result.error) return setError(result.error.message)
    if (result.session) navigate(form.accountType === 'company' ? '/dashboard/company' : '/dashboard/creator', { replace: true })
    else setMessage('Check your email to confirm your account, then sign in to continue.')
  }

  return <main className="page-shell auth-shell"><section className="content-card auth-card"><BrandMark /><div className="eyebrow">Create account</div><h1>Join the ENDLESS marketplace</h1><p>Create a real account as a creator or company buyer.</p>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<form className="form-grid simple-form" onSubmit={handleSubmit}><label><span>Name</span><input value={form.name} onChange={update('name')} autoComplete="name" /></label><label><span>Email</span><input type="email" value={form.email} onChange={update('email')} autoComplete="email" /></label><label><span>Password</span><input type="password" value={form.password} onChange={update('password')} autoComplete="new-password" /></label><label><span>Confirm Password</span><input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} autoComplete="new-password" /></label><label><span>Account Type</span><select value={form.accountType} onChange={update('accountType')}><option value="creator">Creator</option><option value="company">Company / Buyer</option></select></label><button type="submit" className="primary-button wide" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create Account'}</button></form><p className="form-privacy-note">By creating an account, you acknowledge that ENDLESS will use your information to provide account and marketplace features. Read the <Link to="/privacy">Privacy Policy</Link>.</p><div className="auth-links"><Link to="/login">Already have an account? Sign in</Link></div></section></main>
}

function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit = async (event) => { event.preventDefault(); setError(''); setMessage(''); if (!email.trim()) return setError('Enter your email address.'); setIsSubmitting(true); const result = await resetPassword(email.trim()); setIsSubmitting(false); if (result.error) setError(result.error.message); else setMessage('If an account exists for that email, a secure reset link is on its way.') }
  return <main className="page-shell auth-shell"><section className="content-card auth-card"><BrandMark /><div className="eyebrow">Password reset</div><h1>Reset your password</h1><p>We’ll send the next steps to your email.</p>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<form className="form-grid simple-form" onSubmit={handleSubmit}><label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><button type="submit" className="primary-button wide" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send Reset Link'}</button></form></section></main>
}

const privacySections = [
  ['introduction', 'Introduction'],
  ['information-we-collect', 'Information We Collect'],
  ['how-we-use-information', 'How We Use Information'],
  ['idea-and-content-information', 'Idea and Content Information'],
  ['marketplace-communications', 'Marketplace Communications'],
  ['purchases-offers-transactions', 'Purchases, Offers and Transactions'],
  ['information-sharing', 'Information Sharing'],
  ['third-party-services', 'Third-Party Services'],
  ['cookies', 'Cookies and Similar Technologies'],
  ['storage-security', 'Data Storage and Security'],
  ['retention', 'Data Retention'],
  ['privacy-rights', 'User Privacy Rights'],
  ['consent', 'Consent and Withdrawal'],
  ['deletion', 'Account and Data Deletion Requests'],
  ['childrens-privacy', "Children's Privacy"],
  ['changes', 'Changes to This Privacy Policy'],
  ['contact', 'Contact / Privacy Enquiries'],
]

function PrivacyPage() {
  const navigate = useNavigate()

  const jumpToSection = (event) => {
    const id = event.target.value
    if (id) navigate(`/privacy#${id}`)
  }

  return (
    <main className="page-shell privacy-page">
      <section className="page-hero privacy-hero">
        <div className="eyebrow">ENDLESS / Legal</div>
        <h1>Privacy Policy</h1>
        <p>How ENDLESS handles information when you create an account, publish an idea, explore the marketplace, or complete a purchase.</p>
        <div className="privacy-effective">Effective date: 18 September 2026</div>
      </section>

      <div className="privacy-mobile-nav">
        <label htmlFor="privacy-section">Jump to a section</label>
        <select id="privacy-section" defaultValue="" onChange={jumpToSection}>
          <option value="" disabled>Select a section</option>
          {privacySections.map(([id, label]) => <option value={id} key={id}>{label}</option>)}
        </select>
      </div>

      <div className="privacy-layout">
        <aside className="privacy-toc" aria-label="Privacy Policy sections">
          <div className="eyebrow">On this page</div>
          <nav>
            {privacySections.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
          </nav>
        </aside>

        <article className="privacy-content">
          <section id="introduction"><h2>1. Introduction</h2><p>This Privacy Policy explains how ENDLESS collects, uses, stores, and shares personal information in connection with the ENDLESS ideas marketplace. It applies to the website and the account features available through it.</p><p>ENDLESS is currently a focused marketplace application. This policy describes the features and data practices that are implemented today. It does not promise practices or services that are not present in the application.</p></section>
          <section id="information-we-collect"><h2>2. Information We Collect</h2><h3>Account information</h3><p>When you create an account, we collect your name, email address, password credentials handled by the authentication service, and whether you use the account as a creator or company/buyer.</p><h3>Profile information</h3><p>Your profile can include your name, email address, account type, profile image value, and other profile details that you choose to provide. The current profile record stores name, email, account type, profile image, and account creation time.</p><h3>Ideas and uploaded content</h3><p>The submission screen asks for listing information such as title, category, subcategory, industry, summary, protected details, stage, rights information, and asking price. The current screen is a prototype and does not persist those entries. It also has no file-upload control, so ENDLESS does not currently collect uploaded files through that screen. If connected submission storage is enabled later, the information you provide will be handled under this policy.</p><h3>Messages and communications</h3><p>The current interface includes example conversation and offer screens. Those examples are not connected to message or offer storage in the current application. If you contact ENDLESS directly, we may receive the information you include in that communication.</p><h3>Offers and transaction information</h3><p>The current database records completed idea purchases, including the idea, buyer account, amount, rights type, and purchase time. The visible offers and transaction workspace includes demonstration content; no separate offer record or payment-provider record is currently defined in the application.</p><h3>Technical information</h3><p>The browser and services used to deliver the site may process basic request, device, and browser information as part of normal operation. ENDLESS does not currently add analytics or advertising tools to the application. The authentication client stores a session in the browser so that you can remain signed in.</p></section>
          <section id="how-we-use-information"><h2>3. How We Use Information</h2><p>We use information to create and authenticate accounts, show profiles and public idea listings, operate creator and buyer workspaces, display and manage ideas, complete and record purchases, preserve rights and transaction details, respond to enquiries, protect the service, and maintain and improve the application.</p></section>
          <section id="idea-and-content-information"><h2>4. Idea and Content Information</h2><p>Information in a public listing may be visible to other visitors and account holders as part of the marketplace. Protected details are intended to be shown only through the access or purchase flow represented by the application. Do not submit information you do not have the right to share. You remain responsible for the content you provide and for choosing what belongs in a public listing.</p></section>
          <section id="marketplace-communications"><h2>5. Marketplace Communications</h2><p>ENDLESS presents a workspace for creator and buyer conversations. In the current build, the displayed conversations are sample interface content and are not persisted as a message system. Where you send information to ENDLESS or a person through a future supported communication feature, that information may be processed to deliver the communication and maintain the related marketplace context.</p></section>
          <section id="purchases-offers-transactions"><h2>6. Purchases, Offers and Transactions</h2><p>When a signed-in buyer completes a purchase through the current application, ENDLESS records the buyer, idea, amount, rights type, and purchase date. The application does not currently collect card details or connect to a payment provider. Offers and some transaction views are currently interface examples; do not treat them as proof of a completed legal transfer or payment.</p></section>
          <section id="information-sharing"><h2>7. Information Sharing</h2><p>We share information only as needed to operate the application and its marketplace, including showing public profile or idea information, enabling a purchase record to be associated with the relevant buyer and idea, using infrastructure providers that process data for ENDLESS, complying with law, or protecting rights, safety, and the service. We do not sell personal information.</p></section>
          <section id="third-party-services"><h2>8. Third-Party Services</h2><p>The application uses Supabase for authentication and database services. Supabase may process account, profile, idea, and purchase data on ENDLESS's behalf under its own terms and policies. The current application does not integrate an analytics platform, advertising network, file-hosting service, or payment provider.</p></section>
          <section id="cookies"><h2>9. Cookies and Similar Technologies</h2><p>ENDLESS does not currently use advertising or analytics cookies. The authentication client uses browser storage to persist an authenticated session and support sign-in. Browser or infrastructure services may use necessary technical mechanisms to deliver requests securely. You can manage browser storage through your browser settings, but disabling it may prevent sign-in or other account features from working.</p></section>
          <section id="storage-security"><h2>10. Data Storage and Security</h2><p>Account, profile, idea, and purchase records are stored through the configured Supabase project. We use authentication controls, database access policies, and service configuration intended to limit access. No online service can guarantee absolute security, so keep your password private and contact us promptly about suspected unauthorized access.</p></section>
          <section id="retention"><h2>11. Data Retention</h2><p>We retain information for as long as needed to provide the account and marketplace features, maintain purchase and rights records, meet legal or operational obligations, resolve disputes, and enforce agreements. Retention may vary by record type. Some transaction records may need to remain after an account is closed to preserve marketplace history or legal records.</p></section>
          <section id="privacy-rights"><h2>12. User Privacy Rights</h2><p>Depending on where you live, you may have rights to request access to, correction of, deletion of, or a copy of your personal information, or to object to or limit certain processing. You may also have a right to complain to your local data protection authority. We may need to verify your identity before completing a request.</p></section>
          <section id="consent"><h2>13. Consent and Withdrawal</h2><p>Where processing relies on your consent, you may withdraw it by contacting ENDLESS. Withdrawal does not affect processing that took place before withdrawal or processing based on another lawful basis. Some withdrawal requests may mean that we cannot provide an account or feature.</p></section>
          <section id="deletion"><h2>14. Account and Data Deletion Requests</h2><p>To request account or personal data deletion, contact ENDLESS using the privacy enquiry route below and include the email address associated with your account. We may verify the request, explain any information that must be retained, and delete or de-identify eligible information within a reasonable period.</p></section>
          <section id="childrens-privacy"><h2>15. Children's Privacy</h2><p>ENDLESS is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review and remove it where appropriate.</p></section>
          <section id="changes"><h2>16. Changes to This Privacy Policy</h2><p>We may update this policy when the application, its data practices, or legal requirements change. We will post the updated version on this page and change the effective date. Please review this page periodically.</p></section>
          <section id="contact"><h2>17. Contact / Privacy Enquiries</h2><p>For privacy questions, access, correction, withdrawal, or deletion requests, contact the ENDLESS team through the support contact associated with your ENDLESS account or the service through which you received access to ENDLESS. Please include enough detail for us to understand and verify your request.</p></section>
        </article>
      </div>
    </main>
  )
}

function SearchPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [ideaResults, setIdeaResults] = useState([])
  const normalizedQuery = query.trim().toLowerCase()
  const categoryResults = categories.filter((category) => `${category[1]} ${category[2]} ${category[4].join(' ')}`.toLowerCase().includes(normalizedQuery))
  useEffect(() => {
    if (!normalizedQuery) {
      // oxlint-disable-next-line react/set-state-in-effect
      setIdeaResults([])
      return
    }
    loadIdeas({ search: normalizedQuery }).then(({ data }) => setIdeaResults(data ?? []))
  }, [normalizedQuery])

  return (
    <main className="page-shell">
      <section className="page-hero narrow-hero"><div className="eyebrow">Search ENDLESS</div><h1>Find the thread worth following.</h1><p>Search ideas, categories, subcategories, industries, problems, keywords, and creators.</p><div className="search-box search-page-box"><span className="search-icon">⌕</span><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “college food” or “creator tools”…" /></div></section>
      {query && <section className="search-results"><div className="eyebrow">Results for “{query}”</div><div className="search-result-columns"><div className="content-card"><h2>Ideas</h2>{ideaResults.length ? ideaResults.map((idea) => <Link className="search-result" to={`/idea/${idea.slug}`} key={idea.id}><strong>{idea.title}</strong><span>{idea.category} · {idea.industry}</span></Link>) : <div className="empty-state"><strong>No matching ideas yet.</strong><span>Try a broader keyword.</span></div>}</div><div className="content-card"><h2>Categories</h2>{categoryResults.length ? categoryResults.slice(0, 8).map((category) => <Link className="search-result" to={`/category/${category[0]}`} key={category[0]}><strong>{category[1]}</strong><span>{category[3]} ideas · {category[2]}</span></Link>) : <div className="empty-state"><strong>No matching categories.</strong><span>Try another phrase.</span></div>}</div></div></section>}
      {!query && <section className="content-card search-empty"><div className="eyebrow">Start searching</div><h2>Try a problem, category, or creator name.</h2><div className="subcategory-list"><button type="button" onClick={() => setQuery('college food')}>college food</button><button type="button" onClick={() => setQuery('creator tools')}>creator tools</button><button type="button" onClick={() => setQuery('retail')}>retail</button></div></section>}
    </main>
  )
}

function NotFoundPage() {
  return <main className="page-shell"><section className="content-card not-found"><div className="eyebrow">404</div><h1>This page doesn’t exist.</h1><p>Looks like this idea went somewhere else.</p><Link to="/" className="primary-button">Back to ENDLESS</Link></section></main>
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/idea/:id" element={<IdeaDetailPage />} />
        <Route path="/submit" element={<ProtectedRoute><SubmitPage /></ProtectedRoute>} />
        <Route path="/creators" element={<CreatorsPage />} />
        <Route path="/creator/:slug" element={<CreatorProfilePage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/offers" element={<ProtectedRoute><OffersPage /></ProtectedRoute>} />
        <Route path="/purchased" element={<ProtectedRoute><PurchasedPage /></ProtectedRoute>} />
        <Route path="/dashboard/purchased" element={<ProtectedRoute><PurchasedPage /></ProtectedRoute>} />
        <Route path="/licenses" element={<ProtectedRoute><LicensesPage /></ProtectedRoute>} />
        <Route path="/dashboard/licenses" element={<ProtectedRoute><LicensesPage /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/creator" element={<ProtectedRoute role="creator"><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/company" element={<ProtectedRoute role="company"><CompanyDashboardPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/login" element={<AuthPage title="Welcome back" heading="Sign in to ENDLESS" subtitle="Access your listings, offers, and saved opportunities." cta="Sign In" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App