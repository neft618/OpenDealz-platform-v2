import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileSignature,
  Gavel,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react'
import './App.css'
import { supabase } from './lib/supabase'
import {
  connectWallet,
  dealId,
  escrowConfig,
  fund,
  isEscrowReady,
  release,
  releasePartial,
  refund,
  rubToNative,
} from './lib/escrow'
import type { User } from '@supabase/supabase-js'

type Role = 'customer' | 'executor' | 'admin'
type Tab = 'overview' | 'projects' | 'applications' | 'contracts' | 'profile' | 'admin'

interface Profile {
  id: string
  email: string
  full_name: string
  active_role: Role
  created_at?: string
  phone?: string | null
  bio?: string | null
  portfolio_url?: string | null
  company_name?: string | null
  specialization?: string | null
}

interface WalletRow {
  id: string
  user_id: string
  chain_id: number
  address: string
}

interface UserRoleRow {
  user_id: string
  role: Role
}

interface Project {
  id: string
  customer_id: string
  title: string
  description: string
  budget: number
  deadline: string
  status: string
  created_at: string
  project_tags?: Array<{ tag: string | null; tag_id?: string | null; tags?: TagRow | null }>
}

interface ApplicationRow {
  id: string
  project_id: string
  executor_id: string
  proposed_price: number
  proposed_deadline: string
  cover_letter: string
  status: string
  created_at?: string
  projects?: Project | null
  profiles?: Pick<Profile, 'id' | 'email' | 'full_name' | 'phone' | 'bio' | 'portfolio_url' | 'company_name' | 'specialization'> | null
}

interface ContractRow {
  id: string
  project_id: string | null
  application_id: string | null
  customer_id: string
  executor_id: string
  subject: string
  total_amount: number
  platform_fee_percent: number
  deadline: string
  review_period_days: number
  ip_rights: string
  is_confidential: boolean
  termination_terms: string
  payment_type: 'fixed' | 'milestone'
  status: string
  created_at?: string
  customer_signed_at: string | null
  executor_signed_at: string | null
  escrow_deal_id: string | null
  escrow_native_amount: number | null
  escrow_native_symbol: string | null
  profiles_customer?: Pick<Profile, 'full_name'> | null
  profiles_executor?: Pick<Profile, 'full_name'> | null
}

interface MilestoneDraft {
  title: string
  description: string
  amount: string
  deadline: string
}

interface DeliverableRow {
  id: string
  contract_id: string
  submitted_by_id: string
  description: string
  file_url: string | null
  file_name: string | null
  milestone_id: string | null
  is_approved: boolean | null
  review_comment: string | null
  reviewed_at: string | null
  submitted_at: string
}

interface TagRow {
  id: string
  name: string
  slug: string
}

interface ProjectCategoryRow {
  id: string
  name: string
  slug: string
}

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

interface RatingRow {
  user_id: string
  rating: number | null
  review_count: number
}

interface ContractReviewRow {
  id: string
  contract_id: string
  author_id: string
  target_id: string
  rating: number
  comment: string | null
}

interface EscrowTransactionRow {
  id: string
  contract_id: string
  tx_type: string
  tx_hash: string
  created_at: string
}

interface DisputeRow {
  id: string
  contract_id: string
  initiated_by_id: string
  status: string
  resolution: string | null
  resolved_by_id: string | null
  resolution_comment: string | null
  created_at: string
  resolved_at: string | null
}

interface MilestoneRow {
  id: string
  contract_id: string
  title: string
  description: string | null
  amount: number
  deadline: string
  position: number
  status: string
}

interface ReviewDraft {
  rating: string
  comment: string
}

interface MessageRow {
  id: string
  contract_id: string | null
  sender_id: string
  body: string
  file_url: string | null
  is_read: boolean
  created_at: string
  profiles?: Pick<Profile, 'full_name'> | null
}

type AdminChartMetric = 'users' | 'projects' | 'applications' | 'contracts' | 'deal_volume' | 'commission' | 'escrow_transactions'
type AdminChartPeriod = '30_days' | '6_months' | '12_months'

interface ChartPoint {
  key: string
  label: string
  value: number
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([])
  const [wallets, setWallets] = useState<WalletRow[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([])
  const [chatMessages, setChatMessages] = useState<MessageRow[]>([])
  const [tags, setTags] = useState<TagRow[]>([])
  const [projectCategories, setProjectCategories] = useState<ProjectCategoryRow[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [ratings, setRatings] = useState<RatingRow[]>([])
  const [reviews, setReviews] = useState<ContractReviewRow[]>([])
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransactionRow[]>([])
  const [disputes, setDisputes] = useState<DisputeRow[]>([])
  const [milestones, setMilestones] = useState<MilestoneRow[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

	  useEffect(() => {
	    if (!user) {
	      queueMicrotask(() => {
	        setProfile(null)
	        setProfiles([])
	        setUserRoles([])
	        setWallets([])
	        setProjects([])
	        setApplications([])
	        setContracts([])
	        setDeliverables([])
	        setChatMessages([])
	        setTags([])
	        setProjectCategories([])
	        setNotifications([])
	        setRatings([])
	        setReviews([])
	        setEscrowTransactions([])
	        setDisputes([])
	        setMilestones([])
	      })
	      return
	    }
    loadData(user.id)
  }, [user])

  const role = profile?.active_role || 'customer'
  const isAdmin = Boolean(profile?.active_role === 'admin' || userRoles.some((item) => item.user_id === user?.id && item.role === 'admin'))
  const wallet = wallets.find((item) => item.chain_id === escrowConfig.chainId)
  const openProjects = projects.filter((project) => project.status === 'open')
  const myProjects = projects.filter((project) => project.customer_id === user?.id)
  const myContracts = contracts.filter((contract) => user && [contract.customer_id, contract.executor_id].includes(user.id))

  async function loadData(userId: string) {
    setBusy(true)
    setMessage('')
    try {
      const [profileRes, profilesRes, userRolesRes, walletsRes, projectsRes, appsRes, contractsRes, deliverablesRes, messagesRes, tagsRes, categoriesRes, notificationsRes, ratingsRes, reviewsRes, escrowTransactionsRes, disputesRes, milestonesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
        supabase.from('wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('projects').select('*, project_tags(tag, tag_id, tags(id, name, slug))').order('created_at', { ascending: false }),
        supabase
          .from('applications')
          .select('*, projects(*), profiles!applications_executor_id_fkey(id, email, full_name, phone, bio, portfolio_url, company_name, specialization)')
          .order('created_at', { ascending: false }),
        supabase
          .from('contracts')
          .select(
            '*, profiles_customer:profiles!contracts_customer_id_fkey(full_name), profiles_executor:profiles!contracts_executor_id_fkey(full_name)',
          )
          .order('created_at', { ascending: false }),
        supabase.from('deliverables').select('*').order('submitted_at', { ascending: false }),
        supabase
          .from('messages')
          .select('*, profiles!messages_sender_id_fkey(full_name)')
          .order('created_at', { ascending: true }),
        supabase.from('tags').select('*').order('name'),
        supabase.from('project_categories').select('*').order('name'),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
        supabase.from('profile_ratings').select('*'),
        supabase.from('contract_reviews').select('*'),
        supabase.from('escrow_transactions').select('id, contract_id, tx_type, tx_hash, created_at').order('created_at', { ascending: false }),
        supabase.from('disputes').select('*').order('created_at', { ascending: false }),
        supabase.from('milestones').select('*').order('position', { ascending: true }),
      ])

      if (profileRes.error) throw profileRes.error
      if (profilesRes.error) throw profilesRes.error
      if (userRolesRes.error) throw userRolesRes.error
      if (walletsRes.error) throw walletsRes.error
      if (projectsRes.error) throw projectsRes.error
      if (appsRes.error) throw appsRes.error
      if (contractsRes.error) throw contractsRes.error
      if (deliverablesRes.error) throw deliverablesRes.error
      if (messagesRes.error) throw messagesRes.error
      if (tagsRes.error) throw tagsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (notificationsRes.error) throw notificationsRes.error
      if (ratingsRes.error) throw ratingsRes.error
      if (reviewsRes.error) throw reviewsRes.error
      if (escrowTransactionsRes.error) throw escrowTransactionsRes.error
      if (disputesRes.error) throw disputesRes.error
      if (milestonesRes.error) throw milestonesRes.error

      setProfile(profileRes.data)
      setProfiles((profilesRes.data || []) as Profile[])
      setUserRoles((userRolesRes.data || []) as UserRoleRow[])
      setWallets(walletsRes.data || [])
      setProjects(projectsRes.data || [])
      setApplications((appsRes.data || []) as ApplicationRow[])
      setContracts((contractsRes.data || []) as ContractRow[])
      setDeliverables((deliverablesRes.data || []) as DeliverableRow[])
      setChatMessages((messagesRes.data || []) as MessageRow[])
      setTags((tagsRes.data || []) as TagRow[])
      setProjectCategories((categoriesRes.data || []) as ProjectCategoryRow[])
      setNotifications((notificationsRes.data || []) as NotificationRow[])
      setRatings((ratingsRes.data || []) as RatingRow[])
      setReviews((reviewsRes.data || []) as ContractReviewRow[])
      setEscrowTransactions((escrowTransactionsRes.data || []) as EscrowTransactionRow[])
      setDisputes((disputesRes.data || []) as DisputeRow[])
      setMilestones((milestonesRes.data || []) as MilestoneRow[])
    } catch (error) {
      setMessage(readError(error))
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return <AuthView busy={busy} message={message} setMessage={setMessage} />
  }

  if (!profile) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Загрузка профиля</h2>
          <p className="muted">Проверяем сессию и права доступа.</p>
          {message && <div className="notice">{message}</div>}
          {busy && <div className="notice muted-panel">Подключение...</div>}
          <button className="secondary-button" type="button" onClick={() => supabase.auth.signOut()}>
            Выйти
          </button>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">OD</div>
          <div>
            <strong>Open Dealz</strong>
            <span>ИТ-аутсорсинг с escrow</span>
          </div>
        </div>

        <nav className="nav-list">
          <NavButton id="overview" tab={tab} setTab={setTab} icon={<ShieldCheck size={18} />} label="Обзор" />
          <NavButton id="projects" tab={tab} setTab={setTab} icon={<BriefcaseBusiness size={18} />} label="Проекты" />
	          <NavButton id="applications" tab={tab} setTab={setTab} icon={<FileSignature size={18} />} label="Заявки" />
	          <NavButton id="contracts" tab={tab} setTab={setTab} icon={<Gavel size={18} />} label="Контракты" />
	          <NavButton id="profile" tab={tab} setTab={setTab} icon={<Wallet size={18} />} label="Профиль" />
	          {isAdmin && <NavButton id="admin" tab={tab} setTab={setTab} icon={<ShieldCheck size={18} />} label="Админ" />}
	        </nav>

        <button className="ghost-button" onClick={() => supabase.auth.signOut()}>
          <LogOut size={18} />
          Выйти
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="muted">Open Dealz</p>
            <h1>{profile.full_name}</h1>
          </div>
	          <RoleSwitch profile={profile} userRoles={userRoles} setProfile={setProfile} />
        </header>

        {message && <div className="notice">{message}</div>}
        {busy && <div className="notice muted-panel">Загрузка данных...</div>}

        {tab === 'overview' && (
          <Overview
            role={role}
            projects={projects}
            applications={applications}
            contracts={myContracts}
            wallet={wallet}
            setTab={setTab}
            notifications={notifications}
            ratings={ratings}
            profile={profile}
          />
        )}
        {tab === 'projects' && (
          <ProjectsView
            role={role}
            userId={user.id}
            projects={role === 'customer' ? myProjects : openProjects}
            applications={applications}
            tags={tags}
            reload={() => loadData(user.id)}
            setMessage={setMessage}
          />
        )}
        {tab === 'applications' && (
          <ApplicationsView
            userId={user.id}
            role={role}
            applications={applications}
            contracts={contracts}
            escrowTransactions={escrowTransactions}
            reviews={reviews}
            ratings={ratings}
            reload={() => loadData(user.id)}
            setMessage={setMessage}
          />
        )}
        {tab === 'contracts' && (
          <ContractsView
            userId={user.id}
            wallet={wallet}
            contracts={myContracts}
            deliverables={deliverables}
            messages={chatMessages}
            milestones={milestones}
            reviews={reviews}
            disputes={disputes}
            reload={() => loadData(user.id)}
            setMessage={setMessage}
          />
        )}
        {tab === 'profile' && (
          <ProfileView
            profile={profile}
            wallets={wallets}
            contracts={myContracts}
            ratings={ratings}
            reviews={reviews}
            reload={() => loadData(user.id)}
            setMessage={setMessage}
          />
        )}
        {tab === 'admin' && isAdmin && (
          <AdminView
            profiles={profiles}
            userRoles={userRoles}
            projects={projects}
            applications={applications}
	            contracts={contracts}
	            deliverables={deliverables}
	            messages={chatMessages}
	            milestones={milestones}
	            escrowTransactions={escrowTransactions}
	            disputes={disputes}
            tags={tags}
            projectCategories={projectCategories}
            currentUserId={user.id}
            reload={() => loadData(user.id)}
            setMessage={setMessage}
          />
        )}
      </main>
    </div>
  )
}

function AuthView({
  busy,
  message,
  setMessage,
}: {
  busy: boolean
  message: string
  setMessage: (value: string) => void
}) {
  const [isRegister, setIsRegister] = useState(true)
  const [fullName, setFullName] = useState('Демо пользователь')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = isRegister
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        : await supabase.auth.signInWithPassword({ email, password })
      if (result.error) {
        setMessage(authErrorMessage(result.error.message))
        return
      }
      if (isRegister && !result.data.session) {
        setMessage('Аккаунт создан. Проверьте почту и подтвердите регистрацию, затем войдите.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="hero-panel">
        <div className="brand big">
          <div className="brand-mark">OD</div>
          <div>
            <strong>Open Dealz</strong>
            <span>безопасная сделка для ИТ-проектов</span>
          </div>
        </div>
        <h1>Платформа взаимодействия заказчиков и исполнителей ИТ-проектов</h1>
        <p>
          Проекты, заявки, договоры, MetaMask escrow и журнал транзакций в одной нормализованной системе.
        </p>
        <div className="hero-grid">
          <Feature icon={<ShieldCheck />} title="Escrow" text="Депозит фиксируется в смарт-контракте." />
          <Feature icon={<Gavel />} title="Арбитраж" text="Споры связаны с контрактами и доказательствами." />
          <Feature icon={<FileSignature />} title="Договоры" text="Условия сделки хранятся структурно." />
        </div>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <h2>{isRegister ? 'Создать аккаунт' : 'Войти'}</h2>
        {isRegister && (
          <label>
            Имя
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Пароль
          <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {message && <div className="notice">{message}</div>}
        {busy && <div className="notice muted-panel">Подключение...</div>}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Отправка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          <ArrowRight size={18} />
        </button>
        <button className="link-button" type="button" disabled={submitting} onClick={() => setIsRegister((value) => !value)}>
          {isRegister ? 'Уже есть аккаунт' : 'Нужна регистрация'}
        </button>
      </form>
    </main>
  )
}

function Overview({
  role,
  projects,
  applications,
  contracts,
  wallet,
  setTab,
  notifications,
  ratings,
  profile,
}: {
  role: Role
  projects: Project[]
  applications: ApplicationRow[]
  contracts: ContractRow[]
  wallet?: WalletRow
  setTab: (tab: Tab) => void
  notifications: NotificationRow[]
  ratings: RatingRow[]
  profile: Profile
}) {
  const funded = contracts.filter((item) => ['funded', 'in_progress', 'review'].includes(item.status)).length
  const spent = contracts
    .filter((item) => item.customer_id === profile.id && item.status === 'completed')
    .reduce((sum, item) => sum + Number(item.total_amount), 0)
  const earned = contracts
    .filter((item) => item.executor_id === profile.id && item.status === 'completed')
    .reduce((sum, item) => sum + Number(item.total_amount) * (1 - Number(item.platform_fee_percent) / 100), 0)
  const rating = ratings.find((item) => item.user_id === profile.id)

  return (
    <section className="stack">
      <div className="metric-grid">
        <Metric title="Открытые проекты" value={projects.filter((item) => item.status === 'open').length} />
        <Metric title="Заявки" value={applications.length} />
        <Metric title="Контракты" value={contracts.length} />
        <Metric title="Escrow активен" value={funded} />
      </div>
      <div className="metric-grid">
        <Metric title="Потрачено" value={Math.round(spent)} suffix="₽" />
        <Metric title="Заработано" value={Math.round(earned)} suffix="₽" />
        <Metric title="Рейтинг" value={Number(rating?.rating || 0)} />
        <Metric title="Уведомления" value={notifications.filter((item) => !item.is_read).length} />
      </div>
      <div className="wide-panel">
        <div>
          <p className="muted">Текущая роль</p>
          <h2>{role === 'customer' ? 'Заказчик' : role === 'executor' ? 'Исполнитель' : 'Администратор'}</h2>
          <p>
            {wallet
              ? `MetaMask подключен: ${shortAddress(wallet.address)}`
              : 'Подключите кошелек в профиле, чтобы проводить escrow-операции.'}
          </p>
        </div>
        <button className="primary-button" onClick={() => setTab(wallet ? 'projects' : 'profile')}>
          {wallet ? 'Перейти к работе' : 'Подключить кошелек'}
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="panel stack">
        <h2>Уведомления</h2>
        {notifications.length === 0 && <p className="muted">Пока нет новых событий.</p>}
        {notifications.map((item) => (
          <div className="notification-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
            <span className="muted">{new Date(item.created_at).toLocaleString('ru-RU')}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProjectsView({
  role,
  userId,
  projects,
  applications,
  tags,
  reload,
  setMessage,
}: {
  role: Role
  userId: string
  projects: Project[]
  applications: ApplicationRow[]
  tags: TagRow[]
  reload: () => Promise<void>
  setMessage: (message: string) => void
}) {
  const [title, setTitle] = useState('Разработка MVP веб-сервиса')
  const [description, setDescription] = useState('Нужно реализовать личный кабинет, каталог, платежный сценарий и административный раздел.')
  const [budget, setBudget] = useState('150000')
  const [deadline, setDeadline] = useState(nextDate(30))
  const [projectStatusFilter, setProjectStatusFilter] = useState('all')
  const [projectSearch, setProjectSearch] = useState('')
  const [budgetFrom, setBudgetFrom] = useState('')
  const [budgetTo, setBudgetTo] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagFilterIds, setTagFilterIds] = useState<string[]>([])
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false)
  const [responseProject, setResponseProject] = useState<Project | null>(null)
  const [responsePrice, setResponsePrice] = useState('')
  const [responseDeadline, setResponseDeadline] = useState(nextDate(21))
  const [responseLetter, setResponseLetter] = useState('')

  async function createProject(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    const { data, error } = await supabase.from('projects').insert({
      customer_id: userId,
      title,
      description,
      budget: Number(budget),
      deadline,
      status: 'open',
    }).select('id').single()
    if (error) setMessage(error.message)
    else {
      if (selectedTagIds.length) {
        await supabase.from('project_tags').insert(
          selectedTagIds.map((tagId) => ({
            project_id: data.id,
            tag_id: tagId,
            tag: tags.find((tag) => tag.id === tagId)?.name || null,
          })),
        )
      }
      setMessage('Проект опубликован')
      await reload()
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = role === 'customer' && projectStatusFilter !== 'all'
      ? project.status === projectStatusFilter
      : true
    const query = projectSearch.trim().toLowerCase()
    const matchesSearch = query
      ? `${project.title} ${project.description}`.toLowerCase().includes(query)
      : true
    const matchesBudgetFrom = budgetFrom ? Number(project.budget) >= Number(budgetFrom) : true
    const matchesBudgetTo = budgetTo ? Number(project.budget) <= Number(budgetTo) : true
    const projectTagIds = (project.project_tags || []).map((item) => item.tag_id || item.tags?.id).filter(Boolean)
    const matchesTags = tagFilterIds.length
      ? tagFilterIds.every((tagId) => projectTagIds.includes(tagId))
      : true
    return matchesStatus && matchesSearch && matchesBudgetFrom && matchesBudgetTo && matchesTags
  })

  const statusFilters = [
    { value: 'all', label: 'Все' },
    { value: 'draft', label: 'Черновики' },
    { value: 'open', label: 'Открыты' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'completed', label: 'Завершены' },
    { value: 'cancelled', label: 'Отменены' },
  ]

  const toggleSelectedTag = (tagId: string) => {
    setSelectedTagIds((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId])
  }
  const toggleFilterTag = (tagId: string) => {
    setTagFilterIds((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId])
  }

  function openResponseForm(project: Project) {
    setResponseProject(project)
    setResponsePrice(String(project.budget))
    setResponseDeadline(project.deadline)
    setResponseLetter('Готов выполнить проект по ТЗ. Предлагаю зафиксировать оплату через escrow.')
  }

	  async function apply(event: React.FormEvent) {
    event.preventDefault()
    if (!responseProject) return
    setMessage('')
	    const { data, error } = await supabase.from('applications').insert({
	      project_id: responseProject.id,
	      executor_id: userId,
	      proposed_price: Number(responsePrice),
	      proposed_deadline: responseDeadline,
	      cover_letter: responseLetter,
	    }).select('id').single()
	    if (error) setMessage(error.message)
	    else {
	      await supabase.rpc('notify_user', {
	        target_user_id: responseProject.customer_id,
	        notification_type: 'application',
	        notification_title: 'Новый отклик на проект',
	        notification_body: `Исполнитель отправил отклик на "${responseProject.title}"`,
	        target_table: 'applications',
	        target_id: data.id,
	      })
	      setMessage('Заявка отправлена')
      setResponseProject(null)
	      setResponsePrice('')
	      setResponseLetter('')
	      await reload()
		  }
	  }

		  async function cancelProject(project: Project) {
		    const { error } = await supabase.from('projects').update({ status: 'cancelled' }).eq('id', project.id)
	    if (error) setMessage(error.message)
	    else {
	      setMessage('Проект отменен')
		      await reload()
		    }
		  }

		  return (
	    <section className={role === 'executor' ? 'projects-layout executor-projects-layout' : 'projects-layout split-layout'}>
      {role === 'customer' && (
        <form className="panel stack" onSubmit={createProject}>
          <h2>Новый проект</h2>
          <label>
            Название
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Описание
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <div className="form-row">
            <label>
              Бюджет, руб.
              <input type="number" value={budget} onChange={(event) => setBudget(event.target.value)} required />
            </label>
            <label>
              Срок
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
            </label>
          </div>
          <div className="tag-picker">
            <span className="muted">Теги проекта</span>
            <div className="status-filter-row">
              {tags.map((tag) => (
                <button
                  className={selectedTagIds.includes(tag.id) ? 'filter-chip active' : 'filter-chip'}
                  type="button"
                  key={tag.id}
                  onClick={() => toggleSelectedTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <button className="primary-button" type="submit">
            <Plus size={18} />
            Опубликовать
          </button>
        </form>
      )}

      <div className="stack">
        <SectionTitle title={role === 'customer' ? 'Мои проекты' : 'Открытые проекты'} />
        <div className={role === 'executor' ? 'filter-panel horizontal-filter-panel' : 'filter-panel'}>
          <label>
            Поиск
            <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Название, описание..." />
          </label>
          <div className="form-row">
            <label>
              Бюджет от
              <input type="number" value={budgetFrom} onChange={(event) => setBudgetFrom(event.target.value)} placeholder="50000" />
            </label>
            <label>
              Бюджет до
              <input type="number" value={budgetTo} onChange={(event) => setBudgetTo(event.target.value)} placeholder="300000" />
            </label>
          </div>
          {role === 'customer' && (
            <div className="status-filter-row">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  className={projectStatusFilter === filter.value ? 'filter-chip active' : 'filter-chip'}
                  onClick={() => setProjectStatusFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
	          {role === 'executor' && (
	            <div className="tag-dropdown">
	              <button className="secondary-button tag-dropdown-trigger" type="button" onClick={() => setIsTagFilterOpen((value) => !value)}>
	                Теги
	                {tagFilterIds.length > 0 && <span className="tag-count">{tagFilterIds.length}</span>}
	              </button>
	              {isTagFilterOpen && (
	                <div className="tag-dropdown-menu">
	                  {tags.map((tag) => (
	                    <button
	                      className={tagFilterIds.includes(tag.id) ? 'filter-chip active' : 'filter-chip'}
	                      key={tag.id}
	                      type="button"
	                      onClick={() => toggleFilterTag(tag.id)}
	                    >
	                      {tag.name}
	                    </button>
	                  ))}
	                  {tagFilterIds.length > 0 && (
	                    <button className="link-button clear-tags-button" type="button" onClick={() => setTagFilterIds([])}>
	                      Сбросить теги
	                    </button>
	                  )}
	                </div>
	              )}
	            </div>
	          )}
        </div>
        {filteredProjects.length === 0 && <p className="muted">Проекты по выбранным фильтрам не найдены.</p>}
        {filteredProjects.map((project) => {
          const alreadyApplied = applications.some((item) => item.project_id === project.id && item.executor_id === userId)
          return (
            <article className="item-card" key={project.id}>
              <div>
                <p className="muted">{new Date(project.created_at).toLocaleDateString('ru-RU')}</p>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                {!!project.project_tags?.length && (
                  <div className="tag-list">
                    {project.project_tags.map((item, index) => (
                      <span className="mini-tag" key={`${project.id}-${item.tag || item.tags?.id || index}`}>
                        {item.tags?.name || item.tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="item-actions">
                <strong>{Number(project.budget).toLocaleString('ru-RU')} ₽</strong>
                <span className="status">{projectStatusLabel(project.status)}</span>
	                {role === 'executor' && (
	                  <button className="secondary-button" disabled={alreadyApplied} onClick={() => openResponseForm(project)}>
	                    {alreadyApplied ? 'Заявка отправлена' : 'Откликнуться'}
	                  </button>
	                )}
	                {role === 'customer' && !['completed', 'cancelled'].includes(project.status) && (
	                  <button className="secondary-button danger-button" onClick={() => cancelProject(project)}>
	                    Отклонить проект
	                  </button>
	                )}
	              </div>
            </article>
          )
        })}
      </div>
      {responseProject && (
        <div className="modal-backdrop" onClick={() => setResponseProject(null)}>
          <form className="modal-card stack" onSubmit={apply} onClick={(event) => event.stopPropagation()}>
            <div>
              <p className="muted">Отклик на проект</p>
              <h2>{responseProject.title}</h2>
            </div>
            <div className="form-row">
              <label>
                Предлагаемая сумма, руб.
                <input type="number" min="1" value={responsePrice} onChange={(event) => setResponsePrice(event.target.value)} required />
              </label>
              <label>
                Предлагаемый срок
                <input type="date" value={responseDeadline} onChange={(event) => setResponseDeadline(event.target.value)} required />
              </label>
            </div>
            <label>
              Сопроводительное письмо
              <textarea value={responseLetter} onChange={(event) => setResponseLetter(event.target.value)} required />
            </label>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setResponseProject(null)}>
                Отмена
              </button>
              <button className="primary-button" type="submit">
                Отправить заявку
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

function ApplicationsView({
  userId,
  role,
  applications,
  contracts,
  escrowTransactions,
  reviews,
  ratings,
  reload,
  setMessage,
}: {
  userId: string
  role: Role
  applications: ApplicationRow[]
  contracts: ContractRow[]
  escrowTransactions: EscrowTransactionRow[]
  reviews: ContractReviewRow[]
  ratings: RatingRow[]
  reload: () => Promise<void>
  setMessage: (message: string) => void
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null)
  const [profilePreview, setProfilePreview] = useState<ApplicationRow['profiles'] | null>(null)
  const [contractDraft, setContractDraft] = useState<Record<string, {
    subject: string
    totalAmount: string
    deadline: string
    reviewPeriodDays: string
    ipRights: string
    terminationTerms: string
    isConfidential: boolean
    paymentType: 'fixed' | 'milestone'
    milestones: MilestoneDraft[]
  }>>({})

  const visible = applications.filter((item) => {
    const matchesOwner = role === 'executor' ? item.executor_id === userId : item.projects?.customer_id === userId
    const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
    return matchesOwner && matchesStatus
  })

  const applicationFilters = [
    { value: 'all', label: 'Все' },
    { value: 'pending', label: 'Ожидают' },
    { value: 'accepted', label: 'Приняты' },
    { value: 'rejected', label: 'Отклонены' },
    { value: 'withdrawn', label: 'Отозваны' },
  ]
  const profilePreviewRating = profilePreview ? ratings.find((item) => item.user_id === profilePreview.id) : undefined
  const profilePreviewReviews = profilePreview ? reviews.filter((review) => review.target_id === profilePreview.id) : []

  async function accept(app: ApplicationRow) {
    if (!app.projects) return
    const draft = contractDraft[app.id]
    const paymentType = draft?.paymentType || 'fixed'
    if (paymentType === 'milestone') {
      const totalAmount = Number(draft?.totalAmount || app.proposed_price)
      const milestonesTotal = draft?.milestones?.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0) || 0
      if (!draft?.milestones?.length || milestonesTotal !== totalAmount) {
        setMessage('Сумма этапов должна совпадать с общей суммой контракта')
        return
      }
    }
    setMessage('')
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        project_id: app.project_id,
        application_id: app.id,
        customer_id: app.projects.customer_id,
        executor_id: app.executor_id,
        subject: draft?.subject || app.projects.title,
        payment_type: paymentType,
        total_amount: Number(draft?.totalAmount || app.proposed_price),
        deadline: draft?.deadline || app.proposed_deadline,
        review_period_days: Number(draft?.reviewPeriodDays || 7),
        ip_rights: draft?.ipRights || 'customer',
        is_confidential: draft?.isConfidential ?? true,
        termination_terms: draft?.terminationTerms || 'Возврат средств возможен до выпуска оплаты или по решению арбитража.',
        status: 'negotiation',
      })
      .select('id')
      .single()

    if (error) {
      setMessage(error.message)
      return
    }
    if (paymentType === 'milestone' && draft?.milestones?.length) {
      const { error: milestonesError } = await supabase.from('milestones').insert(
        draft.milestones.map((milestone, index) => ({
          contract_id: data.id,
          title: milestone.title,
          description: milestone.description || null,
          amount: Number(milestone.amount),
          deadline: milestone.deadline,
          position: index + 1,
        })),
      )
      if (milestonesError) {
        setMessage(milestonesError.message)
        return
      }
    }
	    await Promise.all([
	      supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id),
	      supabase.from('applications').update({ status: 'rejected' }).eq('project_id', app.project_id).neq('id', app.id),
	      supabase.from('projects').update({ status: 'in_progress' }).eq('id', app.project_id),
	      supabase.rpc('notify_user', {
	        target_user_id: app.executor_id,
	        notification_type: 'contract',
	        notification_title: 'Заявка принята',
	        notification_body: `Заказчик создал контракт по проекту "${app.projects.title}"`,
	        target_table: 'contracts',
	        target_id: data.id,
	      }),
	    ])
	    setMessage(`Контракт создан: ${data.id.slice(0, 8)}`)
	    await reload()
	  }

  async function reject(app: ApplicationRow) {
    const { error } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', app.id)
    if (error) {
      setMessage(error.message)
      return
    }
    await supabase.rpc('notify_user', {
      target_user_id: app.executor_id,
      notification_type: 'application',
      notification_title: 'Заявка отклонена',
      notification_body: `Заказчик отклонил отклик по проекту "${app.projects?.title || 'Проект'}"`,
      target_table: 'applications',
      target_id: app.id,
    })
    setMessage('Заявка отклонена')
    await reload()
  }

  async function withdraw(app: ApplicationRow) {
    const { error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', app.id).eq('executor_id', userId)
    if (error) {
      setMessage(error.message)
      return
    }
    if (app.projects?.customer_id) {
      await supabase.rpc('notify_user', {
        target_user_id: app.projects.customer_id,
        notification_type: 'application',
        notification_title: 'Заявка отозвана',
        notification_body: `Исполнитель отозвал заявку по проекту "${app.projects.title}"`,
        target_table: 'applications',
        target_id: app.id,
      })
    }
    setMessage('Заявка отозвана')
    await reload()
  }

  return (
	    <section className="stack">
	      <SectionTitle title="Заявки" />
	      <div className="status-filter-row">
	        {applicationFilters.map((filter) => (
	          <button
	            className={statusFilter === filter.value ? 'filter-chip active' : 'filter-chip'}
	            key={filter.value}
	            onClick={() => setStatusFilter(filter.value)}
	          >
	            {filter.label}
	          </button>
	        ))}
	      </div>
	      {visible.length === 0 && <p className="muted">Заявки по выбранному статусу не найдены.</p>}
	      {visible.map((app) => {
	        const isExpanded = expandedApplicationId === app.id
	        const rating = ratings.find((item) => item.user_id === app.executor_id)
	        return (
	          <article className="item-card application-card" key={app.id}>
	            <div className="stack">
	              <div>
	                <p className="muted">{app.projects?.title || 'Проект'}</p>
	                <h3>
	                  {role === 'customer' ? (
	                    <button className="profile-link" onClick={() => setProfilePreview(app.profiles || null)}>
	                      {app.profiles?.full_name || 'Исполнитель'}
	                    </button>
	                  ) : (
	                    app.projects?.title || 'Проект'
	                  )}
	                </h3>
	                {role === 'customer' && (
		                  <p className="muted">Рейтинг исполнителя: {formatRating(rating?.rating)}</p>
	                )}
	                <p>{app.cover_letter}</p>
	              </div>
	              {role === 'customer' && app.status === 'pending' && isExpanded && (
	                <ContractTermsEditor
	                  draft={contractDraft[app.id]}
	                  app={app}
	                  onChange={(value) => setContractDraft((current) => ({ ...current, [app.id]: value }))}
	                />
	              )}
	            </div>
	            <div className="item-actions compact-actions">
	              <strong>{Number(app.proposed_price).toLocaleString('ru-RU')} ₽</strong>
	              <span className={`status status-${app.status}`}>{applicationStatusLabel(app.status)}</span>
	              {role === 'customer' && app.status === 'pending' && (
	                <>
	                  <button className="secondary-button" onClick={() => setExpandedApplicationId(isExpanded ? null : app.id)}>
	                    {isExpanded ? 'Свернуть условия' : 'Настроить контракт'}
	                  </button>
	                  {isExpanded && (
	                    <button className="primary-button" onClick={() => accept(app)}>
	                      Принять
	                    </button>
	                  )}
	                  <button className="secondary-button danger-button" onClick={() => reject(app)}>
	                    Отклонить
	                  </button>
	                </>
	              )}
	              {role === 'executor' && app.status === 'pending' && (
	                <button className="secondary-button danger-button" onClick={() => withdraw(app)}>
	                  Отозвать
	                </button>
	              )}
	            </div>
	          </article>
	        )
	      })}
	      {profilePreview && (
	        <div className="modal-backdrop" onClick={() => setProfilePreview(null)}>
	          <div className="modal-card stack" onClick={(event) => event.stopPropagation()}>
		            <div>
		              <p className="muted">Профиль исполнителя</p>
		              <h2>{profilePreview.full_name}</h2>
		            </div>
		            <Info label="Рейтинг" value={formatRating(profilePreviewRating?.rating)} />
		            <Info label="Email" value={profilePreview.email || 'Не указан'} />
	            <Info label="Телефон" value={profilePreview.phone || 'Не указан'} />
	            <Info label="Специализация" value={profilePreview.specialization || 'Не указана'} />
	            <div>
	              <p className="muted">О себе</p>
	              <p>{profilePreview.bio || 'Описание пока не заполнено.'}</p>
		            </div>
		            {profilePreview.portfolio_url && <a href={profilePreview.portfolio_url} target="_blank" rel="noreferrer">Открыть портфолио</a>}
		            <div className="stack">
		              <h3>Отзывы по сделкам</h3>
		              {profilePreviewReviews.length === 0 && <p className="muted">Отзывов по завершенным сделкам пока нет.</p>}
		              {profilePreviewReviews.map((review) => {
		                const contract = contracts.find((item) => item.id === review.contract_id)
		                const tx = escrowTransactions.find((item) => item.contract_id === review.contract_id && item.tx_type === 'release')
		                  || escrowTransactions.find((item) => item.contract_id === review.contract_id)
		                return (
		                  <div className="review-note" key={review.id}>
		                    <strong>{review.rating}/5</strong>
		                    <p>{review.comment || 'Без комментария'}</p>
		                    <p className="muted">{contract?.subject || `Сделка #${review.contract_id.slice(0, 8)}`}</p>
		                    {tx?.tx_hash ? (
		                      <a href={txHashUrl(tx.tx_hash)} target="_blank" rel="noreferrer">
		                        Подтверждение транзакции: {shortAddress(tx.tx_hash)}
		                      </a>
		                    ) : (
		                      <span className="muted">Хэш транзакции не найден</span>
		                    )}
		                  </div>
		                )
		              })}
		            </div>
		            <button className="secondary-button" onClick={() => setProfilePreview(null)}>Закрыть</button>
	          </div>
	        </div>
	      )}
	    </section>
	  )
	}

function ContractsView({
  userId,
  wallet,
  contracts,
  deliverables,
  messages,
  milestones,
  reviews,
  disputes,
  reload,
  setMessage,
}: {
  userId: string
  wallet?: WalletRow
  contracts: ContractRow[]
  deliverables: DeliverableRow[]
  messages: MessageRow[]
  milestones: MilestoneRow[]
  reviews: ContractReviewRow[]
  disputes: DisputeRow[]
  reload: () => Promise<void>
  setMessage: (message: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(contracts[0]?.id || null)
  const [activeContractTab, setActiveContractTab] = useState<'terms' | 'deliverables' | 'chat' | 'history'>('terms')
  const [deliverableDescription, setDeliverableDescription] = useState('')
  const [deliverableFileUrl, setDeliverableFileUrl] = useState('')
  const [deliverableFileName, setDeliverableFileName] = useState('')
  const [deliverableMilestoneId, setDeliverableMilestoneId] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>({ rating: '5', comment: '' })
  const [disputeReason, setDisputeReason] = useState('')
  const [chatBody, setChatBody] = useState('')

  const selectedContract = contracts.find((contract) => contract.id === selectedId) || contracts[0]
  const selectedDeliverables = selectedContract
    ? deliverables.filter((item) => item.contract_id === selectedContract.id)
    : []
  const selectedMessages = selectedContract
    ? messages.filter((item) => item.contract_id === selectedContract.id)
    : []
  const selectedMilestones = selectedContract
    ? milestones.filter((item) => item.contract_id === selectedContract.id)
    : []
  const selectedDisputes = selectedContract
    ? disputes.filter((item) => item.contract_id === selectedContract.id)
    : []

	  useEffect(() => {
	    queueMicrotask(() => {
	      if (!selectedId && contracts[0]) setSelectedId(contracts[0].id)
	      if (selectedId && !contracts.some((contract) => contract.id === selectedId)) setSelectedId(contracts[0]?.id || null)
	    })
	  }, [contracts, selectedId])

  async function sign(contract: ContractRow) {
    const update: Partial<ContractRow> & { signed_at?: string } = {}
    const now = new Date().toISOString()
    if (contract.customer_id === userId) update.customer_signed_at = now
    if (contract.executor_id === userId) update.executor_signed_at = now
    const bothSigned = Boolean(update.customer_signed_at || contract.customer_signed_at) && Boolean(update.executor_signed_at || contract.executor_signed_at)
    if (bothSigned) {
      update.status = 'signed'
      update.signed_at = now
    }
    const { error } = await supabase.from('contracts').update(update).eq('id', contract.id)
    if (error) setMessage(error.message)
    else await reload()
  }

  async function fundContract(contract: ContractRow) {
    if (!wallet) {
      setMessage('Сначала подключите кошелек в профиле')
      return
    }
    const { data: executorWallet, error: walletError } = await supabase
      .from('wallets')
      .select('address')
      .eq('user_id', contract.executor_id)
      .eq('chain_id', escrowConfig.chainId)
      .maybeSingle()
    if (walletError || !executorWallet?.address) {
      setMessage('У исполнителя нет кошелька для выбранной сети')
      return
    }

    try {
      const nativeAmount = rubToNative(Number(contract.total_amount))
      const txHash = await fund(contract.id, executorWallet.address, nativeAmount)
      await supabase.from('escrow_transactions').insert({
        contract_id: contract.id,
        tx_type: 'lock',
        status: 'confirmed',
        amount_rub: contract.total_amount,
        native_amount: Number(nativeAmount),
        native_symbol: escrowConfig.nativeSymbol,
        chain_id: escrowConfig.chainId,
        contract_address: escrowConfig.contractAddress,
        from_user_id: contract.customer_id,
        tx_hash: txHash,
        note: 'Депозит заказчика в escrow',
      })
      await supabase
        .from('contracts')
        .update({
          status: 'funded',
          escrow_chain_id: escrowConfig.chainId,
          escrow_contract_address: escrowConfig.contractAddress,
          escrow_deal_id: dealId(contract.id),
          escrow_native_amount: Number(nativeAmount),
          escrow_native_symbol: escrowConfig.nativeSymbol,
          escrow_funded_at: new Date().toISOString(),
        })
        .eq('id', contract.id)
      setMessage('Средства отправлены в escrow')
      await reload()
    } catch (error) {
      setMessage(readError(error))
    }
  }

  async function recordRelease(contract: ContractRow, txHash: string, amountRub: number, nativeAmount: number | null, note: string) {
    const fee = (amountRub * Number(contract.platform_fee_percent)) / 100
    await supabase.from('escrow_transactions').insert({
      contract_id: contract.id,
      tx_type: 'release',
      status: 'confirmed',
      amount_rub: amountRub - fee,
      native_amount: nativeAmount,
      native_symbol: contract.escrow_native_symbol || escrowConfig.nativeSymbol,
      chain_id: escrowConfig.chainId,
      contract_address: escrowConfig.contractAddress,
      to_user_id: contract.executor_id,
      tx_hash: txHash,
      note,
    })
  }

  async function releaseContract(contract: ContractRow) {
    try {
      const txHash = await release(contract.id)
      await recordRelease(contract, txHash, Number(contract.total_amount), contract.escrow_native_amount, 'Выплата исполнителю из escrow')
      await supabase.from('contracts').update({ status: 'completed', escrow_released_at: new Date().toISOString() }).eq('id', contract.id)
      if (contract.project_id) {
        await supabase.from('projects').update({ status: 'completed' }).eq('id', contract.project_id)
      }
      setMessage('Средства выпущены исполнителю')
      await reload()
    } catch (error) {
      setMessage(readError(error))
    }
  }

  async function submitDeliverable(contract: ContractRow) {
    if (!deliverableDescription.trim()) {
      setMessage('Опишите результат работы перед сдачей')
      return
    }
    const contractMilestones = milestones.filter((item) => item.contract_id === contract.id)
    const milestoneId = contract.payment_type === 'milestone' ? deliverableMilestoneId || contractMilestones.find((item) => item.status !== 'approved')?.id : null
    if (contract.payment_type === 'milestone' && !milestoneId) {
      setMessage('Выберите этап для сдачи результата')
      return
    }

    const { error: deliverableError } = await supabase.from('deliverables').insert({
      contract_id: contract.id,
      milestone_id: milestoneId,
      submitted_by_id: userId,
      description: deliverableDescription.trim(),
      file_url: deliverableFileUrl.trim() || null,
      file_name: deliverableFileName.trim() || null,
    })
    if (deliverableError) {
      setMessage(deliverableError.message)
      return
    }

    if (milestoneId) {
      await supabase.from('milestones').update({ status: 'submitted' }).eq('id', milestoneId)
    }

    const { error: statusError } = await supabase.from('contracts').update({ status: 'review' }).eq('id', contract.id)
    if (statusError) {
      setMessage(statusError.message)
      return
    }

    setDeliverableDescription('')
    setDeliverableFileUrl('')
    setDeliverableFileName('')
    setDeliverableMilestoneId('')
    await supabase.rpc('notify_user', {
      target_user_id: contract.customer_id,
      notification_type: 'deliverable',
      notification_title: 'Исполнитель прикрепил результат',
      notification_body: `Результат по контракту "${contract.subject}" ожидает проверки`,
      target_table: 'deliverables',
      target_id: contract.id,
    })
    setMessage('Работа отправлена заказчику на проверку')
    await reload()
  }

  async function approveDeliverable(contract: ContractRow, deliverable: DeliverableRow) {
    const { error } = await supabase
      .from('deliverables')
      .update({
        is_approved: true,
        reviewed_at: new Date().toISOString(),
        review_comment: reviewComment || 'Работа принята',
      })
      .eq('id', deliverable.id)

    if (error) {
      setMessage(error.message)
      return
    }
    if (contract.payment_type !== 'milestone' || !deliverable.milestone_id) {
      await releaseContract(contract)
      return
    }

    const milestone = milestones.find((item) => item.id === deliverable.milestone_id)
    if (!milestone) {
      setMessage('Этап для результата не найден')
      return
    }
    try {
      const contractMilestones = milestones.filter((item) => item.contract_id === contract.id)
      const isFinalMilestone = contractMilestones.every((item) => item.id === milestone.id || item.status === 'approved')
      const nativeAmount = isFinalMilestone ? null : rubToNative(Number(milestone.amount))
      const txHash = isFinalMilestone ? await release(contract.id) : await releasePartial(contract.id, nativeAmount as string)
      await recordRelease(
        contract,
        txHash,
        Number(milestone.amount),
        nativeAmount ? Number(nativeAmount) : null,
        `Выплата по этапу: ${milestone.title}`,
      )
      await supabase.from('milestones').update({ status: 'approved' }).eq('id', milestone.id)
      if (isFinalMilestone) {
        await supabase.from('contracts').update({ status: 'completed', escrow_released_at: new Date().toISOString() }).eq('id', contract.id)
        if (contract.project_id) {
          await supabase.from('projects').update({ status: 'completed' }).eq('id', contract.project_id)
        }
      } else {
        await supabase.from('contracts').update({ status: 'funded' }).eq('id', contract.id)
      }
      setMessage(isFinalMilestone ? 'Последний этап принят, контракт завершен' : 'Этап принят и выплачен исполнителю')
      await reload()
    } catch (error) {
      setMessage(readError(error))
    }
  }

  async function requestRevision(deliverable: DeliverableRow) {
    const { error } = await supabase
      .from('deliverables')
      .update({
        is_approved: false,
        reviewed_at: new Date().toISOString(),
        review_comment: reviewComment || 'Требуются доработки',
      })
      .eq('id', deliverable.id)

    if (error) {
      setMessage(error.message)
      return
    }
    await supabase.from('contracts').update({ status: 'funded' }).eq('id', deliverable.contract_id)
    if (deliverable.milestone_id) {
      await supabase.from('milestones').update({ status: 'in_progress' }).eq('id', deliverable.milestone_id)
    }
    setMessage('Комментарий по доработкам отправлен')
    await reload()
  }

  async function submitReview(contract: ContractRow) {
    const targetId = contract.customer_id === userId ? contract.executor_id : contract.customer_id
    const { error } = await supabase.from('contract_reviews').insert({
      contract_id: contract.id,
      author_id: userId,
      target_id: targetId,
      rating: Number(reviewDraft.rating),
      comment: reviewDraft.comment.trim() || null,
    })
    if (error) {
      setMessage(error.message)
      return
    }
    setReviewDraft({ rating: '5', comment: '' })
    setMessage('Оценка сохранена')
    await reload()
  }

  async function openDispute(contract: ContractRow) {
    if (!disputeReason.trim()) {
      setMessage('Укажите причину открытия спора')
      return
    }
    const { data, error } = await supabase.from('disputes').insert({
      contract_id: contract.id,
      initiated_by_id: userId,
      status: 'open',
      resolution_comment: disputeReason.trim(),
    }).select('id').single()
    if (error) {
      setMessage(error.message)
      return
    }
    await supabase.from('contracts').update({ status: 'disputed' }).eq('id', contract.id)
    await supabase.from('messages').insert({
      contract_id: contract.id,
      dispute_id: data.id,
      sender_id: userId,
      body: `Открыт спор: ${disputeReason.trim()}`,
    })
    await Promise.all([
      supabase.rpc('notify_user', {
        target_user_id: contract.customer_id === userId ? contract.executor_id : contract.customer_id,
        notification_type: 'dispute',
        notification_title: 'Открыт спор по контракту',
        notification_body: `По контракту "${contract.subject}" открыт спор`,
        target_table: 'disputes',
        target_id: data.id,
      }),
    ])
    setDisputeReason('')
    setMessage('Спор открыт и передан администратору')
    await reload()
  }

  async function sendMessage(contract: ContractRow) {
    if (!chatBody.trim()) return
    const { error } = await supabase.from('messages').insert({
      contract_id: contract.id,
      sender_id: userId,
      body: chatBody.trim(),
    })

    if (error) {
      setMessage(error.message)
      return
    }
    setChatBody('')
    await reload()
  }

  return (
    <section className="contracts-layout">
      <SectionTitle title="Контракты и escrow" />
      {!isEscrowReady() && (
        <div className="notice">
          Для реальных транзакций задеплойте `contracts/ProjectEscrow.sol` и укажите `VITE_ESCROW_CONTRACT_ADDRESS`.
        </div>
      )}
      <div className="contracts-master">
      {contracts.map((contract) => {
        const isCustomer = contract.customer_id === userId
        const canSign = (isCustomer && !contract.customer_signed_at) || (!isCustomer && !contract.executor_signed_at)
        return (
          <article
            className={selectedContract?.id === contract.id ? 'contract-card selected' : 'contract-card'}
            key={contract.id}
            onClick={() => setSelectedId(contract.id)}
          >
            <div>
              <p className="muted">#{contract.id.slice(0, 8)}</p>
              <h3>{contract.subject}</h3>
              <p>
                {contract.profiles_customer?.full_name || 'Заказчик'} → {contract.profiles_executor?.full_name || 'Исполнитель'}
              </p>
            </div>
            <div className="contract-meta">
              <strong>{Number(contract.total_amount).toLocaleString('ru-RU')} ₽</strong>
              <span className="status">{contractStatusLabel(contract.status)}</span>
              {contract.escrow_deal_id && <code>{shortAddress(contract.escrow_deal_id)}</code>}
            </div>
            <div className="button-row">
              {canSign && ['negotiation', 'draft'].includes(contract.status) && (
                <button className="secondary-button" onClick={() => sign(contract)}>
                  <Check size={16} />
                  Подписать
                </button>
              )}
              {isCustomer && contract.status === 'signed' && (
                <button className="primary-button" disabled={!isEscrowReady()} onClick={() => fundContract(contract)}>
                  <Wallet size={16} />
                  Внести escrow
                </button>
              )}
              {isCustomer && ['funded', 'review'].includes(contract.status) && (
                <button className="primary-button" disabled={!isEscrowReady()} onClick={() => releaseContract(contract)}>
                  Выплатить
                </button>
              )}
              {!isCustomer && contract.status === 'funded' && <span className="muted">Откройте карточку для сдачи</span>}
            </div>
          </article>
        )
      })}
      </div>
      {selectedContract && (
        <ContractDetail
          userId={userId}
          contract={selectedContract}
          activeTab={activeContractTab}
          setActiveTab={setActiveContractTab}
          deliverables={selectedDeliverables}
          messages={selectedMessages}
          deliverableDescription={deliverableDescription}
          setDeliverableDescription={setDeliverableDescription}
          deliverableFileUrl={deliverableFileUrl}
          setDeliverableFileUrl={setDeliverableFileUrl}
          deliverableFileName={deliverableFileName}
          setDeliverableFileName={setDeliverableFileName}
          deliverableMilestoneId={deliverableMilestoneId}
          setDeliverableMilestoneId={setDeliverableMilestoneId}
          reviewComment={reviewComment}
          setReviewComment={setReviewComment}
          reviewDraft={reviewDraft}
          setReviewDraft={setReviewDraft}
          chatBody={chatBody}
          setChatBody={setChatBody}
          milestones={selectedMilestones}
          reviews={reviews.filter((item) => item.contract_id === selectedContract.id)}
          disputes={selectedDisputes}
          disputeReason={disputeReason}
          setDisputeReason={setDisputeReason}
          onSign={sign}
          onFund={fundContract}
          onSubmitDeliverable={submitDeliverable}
          onApproveDeliverable={approveDeliverable}
          onRequestRevision={requestRevision}
          onSendMessage={sendMessage}
          onSubmitReview={submitReview}
          onOpenDispute={openDispute}
          wallet={wallet}
        />
      )}
    </section>
  )
}

function ContractTermsEditor({
  app,
  draft,
  onChange,
}: {
  app: ApplicationRow
  draft?: {
    subject: string
    totalAmount: string
    deadline: string
    reviewPeriodDays: string
    ipRights: string
    terminationTerms: string
    isConfidential: boolean
    paymentType: 'fixed' | 'milestone'
    milestones: MilestoneDraft[]
  }
  onChange: (value: {
    subject: string
    totalAmount: string
    deadline: string
    reviewPeriodDays: string
    ipRights: string
    terminationTerms: string
    isConfidential: boolean
    paymentType: 'fixed' | 'milestone'
    milestones: MilestoneDraft[]
  }) => void
}) {
  const value = draft || {
    subject: app.projects?.title || '',
    totalAmount: String(app.proposed_price),
    deadline: app.proposed_deadline,
    reviewPeriodDays: '7',
    ipRights: 'customer',
    terminationTerms: 'Исполнитель передает результат работ после приемки. Возврат средств возможен до выпуска escrow или по итогам спора.',
    isConfidential: true,
    paymentType: 'fixed' as const,
    milestones: [
      {
        title: 'Основной этап',
        description: 'Передача согласованного результата работ',
        amount: String(app.proposed_price),
        deadline: app.proposed_deadline,
      },
    ],
  }

  const set = (patch: Partial<typeof value>) => onChange({ ...value, ...patch })
  const updateMilestone = (index: number, patch: Partial<MilestoneDraft>) => {
    set({
      milestones: value.milestones.map((milestone, currentIndex) =>
        currentIndex === index ? { ...milestone, ...patch } : milestone,
      ),
    })
  }
  const addMilestone = () => {
    set({
      milestones: [
        ...value.milestones,
        { title: `Этап ${value.milestones.length + 1}`, description: '', amount: '', deadline: value.deadline },
      ],
    })
  }
  const removeMilestone = (index: number) => {
    set({ milestones: value.milestones.filter((_milestone, currentIndex) => currentIndex !== index) })
  }
  const milestonesTotal = value.milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0)

  return (
    <div className="terms-editor">
      <h4>Условия контракта</h4>
      <div className="segmented-control">
        <button
          type="button"
          className={value.paymentType === 'fixed' ? 'active' : ''}
          onClick={() => set({ paymentType: 'fixed' })}
        >
          Оплата сразу
        </button>
        <button
          type="button"
          className={value.paymentType === 'milestone' ? 'active' : ''}
          onClick={() => set({ paymentType: 'milestone' })}
        >
          По этапам
        </button>
      </div>
      <label>
        Предмет договора
        <input value={value.subject} onChange={(event) => set({ subject: event.target.value })} />
      </label>
      <div className="form-row">
        <label>
          Сумма
          <input type="number" value={value.totalAmount} onChange={(event) => set({ totalAmount: event.target.value })} />
        </label>
        <label>
          Срок
          <input type="date" value={value.deadline} onChange={(event) => set({ deadline: event.target.value })} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Приемка, дней
          <input type="number" min="1" value={value.reviewPeriodDays} onChange={(event) => set({ reviewPeriodDays: event.target.value })} />
        </label>
        <label>
          Права на результат
          <select value={value.ipRights} onChange={(event) => set({ ipRights: event.target.value })}>
            <option value="customer">Заказчику</option>
            <option value="executor">Исполнителю</option>
            <option value="shared">Совместные</option>
          </select>
        </label>
      </div>
      <label>
        Условия расторжения и приемки
        <textarea value={value.terminationTerms} onChange={(event) => set({ terminationTerms: event.target.value })} />
      </label>
      <label className="checkbox-line">
        <input type="checkbox" checked={value.isConfidential} onChange={(event) => set({ isConfidential: event.target.checked })} />
        Конфиденциальный проект
      </label>
      {value.paymentType === 'milestone' && (
        <div className="milestone-editor">
          <div className="milestone-editor-header">
            <h4>Этапы оплаты</h4>
            <span className={milestonesTotal === Number(value.totalAmount) ? 'status status-accepted' : 'status status-pending'}>
              Итого: {milestonesTotal.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          {value.milestones.map((milestone, index) => (
            <div className="milestone-row" key={`${milestone.title}-${index}`}>
              <label>
                Название этапа
                <input value={milestone.title} onChange={(event) => updateMilestone(index, { title: event.target.value })} />
              </label>
              <label>
                Описание
                <input value={milestone.description} onChange={(event) => updateMilestone(index, { description: event.target.value })} />
              </label>
              <div className="form-row">
                <label>
                  Сумма
                  <input type="number" value={milestone.amount} onChange={(event) => updateMilestone(index, { amount: event.target.value })} />
                </label>
                <label>
                  Срок
                  <input type="date" value={milestone.deadline} onChange={(event) => updateMilestone(index, { deadline: event.target.value })} />
                </label>
              </div>
              {value.milestones.length > 1 && (
                <button className="secondary-button" type="button" onClick={() => removeMilestone(index)}>
                  Удалить этап
                </button>
              )}
            </div>
          ))}
          <button className="secondary-button" type="button" onClick={addMilestone}>
            <Plus size={16} />
            Добавить этап
          </button>
        </div>
      )}
    </div>
  )
}

function ContractDetail({
  userId,
  contract,
  activeTab,
  setActiveTab,
  deliverables,
  messages,
  deliverableDescription,
  setDeliverableDescription,
  deliverableFileUrl,
  setDeliverableFileUrl,
  deliverableFileName,
  setDeliverableFileName,
  deliverableMilestoneId,
  setDeliverableMilestoneId,
  reviewComment,
  setReviewComment,
  reviewDraft,
  setReviewDraft,
  chatBody,
  setChatBody,
  milestones,
  reviews,
  disputes,
  disputeReason,
  setDisputeReason,
  onSign,
  onFund,
  onSubmitDeliverable,
  onApproveDeliverable,
  onRequestRevision,
  onSendMessage,
  onSubmitReview,
  onOpenDispute,
  wallet,
}: {
  userId: string
  contract: ContractRow
  activeTab: 'terms' | 'deliverables' | 'chat' | 'history'
  setActiveTab: (tab: 'terms' | 'deliverables' | 'chat' | 'history') => void
  deliverables: DeliverableRow[]
  messages: MessageRow[]
  deliverableDescription: string
  setDeliverableDescription: (value: string) => void
  deliverableFileUrl: string
  setDeliverableFileUrl: (value: string) => void
  deliverableFileName: string
  setDeliverableFileName: (value: string) => void
  deliverableMilestoneId: string
  setDeliverableMilestoneId: (value: string) => void
  reviewComment: string
  setReviewComment: (value: string) => void
  reviewDraft: ReviewDraft
  setReviewDraft: (value: ReviewDraft) => void
  chatBody: string
  setChatBody: (value: string) => void
  milestones: MilestoneRow[]
  reviews: ContractReviewRow[]
  disputes: DisputeRow[]
  disputeReason: string
  setDisputeReason: (value: string) => void
  onSign: (contract: ContractRow) => Promise<void>
  onFund: (contract: ContractRow) => Promise<void>
  onSubmitDeliverable: (contract: ContractRow) => Promise<void>
  onApproveDeliverable: (contract: ContractRow, deliverable: DeliverableRow) => Promise<void>
  onRequestRevision: (deliverable: DeliverableRow) => Promise<void>
  onSendMessage: (contract: ContractRow) => Promise<void>
  onSubmitReview: (contract: ContractRow) => Promise<void>
  onOpenDispute: (contract: ContractRow) => Promise<void>
  wallet?: WalletRow
}) {
  const isCustomer = contract.customer_id === userId
  const canSign = (isCustomer && !contract.customer_signed_at) || (!isCustomer && !contract.executor_signed_at)
  const latestDeliverable = deliverables[0]
  const unapprovedMilestones = milestones.filter((item) => item.status !== 'approved')
  const hasReviewed = reviews.some((item) => item.author_id === userId)
  const activeDispute = disputes.find((item) => item.status !== 'resolved')

  return (
    <article className="contract-detail">
      <div className="detail-header">
        <div>
          <p className="muted">Карточка сделки #{contract.id.slice(0, 8)}</p>
          <h2>{contract.subject}</h2>
          <p>
            {contract.profiles_customer?.full_name || 'Заказчик'} → {contract.profiles_executor?.full_name || 'Исполнитель'}
          </p>
        </div>
        <span className="status">{contractStatusLabel(contract.status)}</span>
      </div>

      <div className="tabbar">
        <button className={activeTab === 'terms' ? 'active' : ''} onClick={() => setActiveTab('terms')}>Условия</button>
        <button className={activeTab === 'deliverables' ? 'active' : ''} onClick={() => setActiveTab('deliverables')}>Сдача работы</button>
        <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
          <MessageCircle size={16} />
          Чат
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>История</button>
      </div>

      {activeTab === 'terms' && (
        <div className="detail-grid">
	          <Info label="Сумма" value={`${Number(contract.total_amount).toLocaleString('ru-RU')} ₽`} />
	          <Info label="Оплата" value={contract.payment_type === 'milestone' ? 'По этапам' : 'Сразу'} />
	          <Info label="Комиссия" value={`${Number(contract.platform_fee_percent)}%`} />
          <Info label="Срок" value={new Date(contract.deadline).toLocaleDateString('ru-RU')} />
          <Info label="Права" value={contract.ip_rights === 'customer' ? 'Заказчику' : contract.ip_rights === 'executor' ? 'Исполнителю' : 'Совместные'} />
          <Info label="Конфиденциальность" value={contract.is_confidential ? 'Да' : 'Нет'} />
          <Info label="Приемка" value={`${contract.review_period_days} дней`} />
	          <div className="full-row">
	            <p className="muted">Условия расторжения и приемки</p>
	            <p>{contract.termination_terms}</p>
	          </div>
	          {disputes.length > 0 && (
	            <div className="submit-box full-row">
	              <h3>Спор по сделке</h3>
	              {disputes.map((dispute) => (
	                <div className="review-note" key={dispute.id}>
	                  <strong>{disputeStatusLabel(dispute.status)}</strong>
	                  <p>{dispute.resolution_comment || 'Комментарий не указан'}</p>
	                  {dispute.resolution && <p className="muted">Решение: {disputeResolutionLabel(dispute.resolution)}</p>}
	                </div>
	              ))}
	            </div>
	          )}
		          <div className="button-row full-row">
            {canSign && ['negotiation', 'draft'].includes(contract.status) && (
              <button className="secondary-button" onClick={() => onSign(contract)}>
                <Check size={16} />
                Подписать договор
              </button>
            )}
	            {isCustomer && contract.status === 'signed' && (
              <button className="primary-button" disabled={!wallet || !isEscrowReady()} onClick={() => onFund(contract)}>
                <Wallet size={16} />
                Внести escrow
              </button>
	            )}
		          </div>
	          {['funded', 'review'].includes(contract.status) && !activeDispute && (
	            <div className="submit-box full-row">
	              <h3>Открыть спор</h3>
	              <label>
	                Причина спора
	                <textarea value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} placeholder="Опишите проблему, приложите ссылки на доказательства..." />
	              </label>
	              <button className="secondary-button danger-button" onClick={() => onOpenDispute(contract)}>
	                Открыть спор
	              </button>
	            </div>
	          )}
	          {contract.status === 'disputed' && activeDispute && (
	            <div className="notice full-row">
	              Сделка находится в споре. Дальнейшее решение принимает администратор.
	            </div>
	          )}
	          {milestones.length > 0 && (
	            <div className="full-row stack">
	              <h3>Этапы договора</h3>
	              <div className="milestone-list">
	                {milestones.map((milestone) => (
	                  <div className="milestone-card" key={milestone.id}>
	                    <div>
	                      <strong>{milestone.position}. {milestone.title}</strong>
	                      <p>{milestone.description || 'Описание этапа не указано'}</p>
	                    </div>
	                    <div className="item-actions">
	                      <strong>{Number(milestone.amount).toLocaleString('ru-RU')} ₽</strong>
	                      <span className={`status status-${milestone.status}`}>{milestoneStatusLabel(milestone.status)}</span>
	                    </div>
	                  </div>
	                ))}
	              </div>
	            </div>
	          )}
	        </div>
	      )}

      {activeTab === 'deliverables' && (
        <div className="stack">
	          {!isCustomer && contract.status === 'funded' && (
	            <div className="submit-box">
	              <h3>Сдать результат работы</h3>
	              {contract.payment_type === 'milestone' && (
	                <label>
	                  Этап
	                  <select value={deliverableMilestoneId} onChange={(event) => setDeliverableMilestoneId(event.target.value)} required>
	                    <option value="">Выберите этап</option>
	                    {unapprovedMilestones.map((milestone) => (
	                      <option value={milestone.id} key={milestone.id}>
	                        {milestone.position}. {milestone.title} — {Number(milestone.amount).toLocaleString('ru-RU')} ₽
	                      </option>
	                    ))}
	                  </select>
	                </label>
	              )}
	              <label>
                Описание результата
                <textarea value={deliverableDescription} onChange={(event) => setDeliverableDescription(event.target.value)} />
              </label>
              <div className="form-row">
                <label>
                  Название файла
                  <input value={deliverableFileName} onChange={(event) => setDeliverableFileName(event.target.value)} placeholder="archive.zip" />
                </label>
                <label>
                  Ссылка на файл
                  <input value={deliverableFileUrl} onChange={(event) => setDeliverableFileUrl(event.target.value)} placeholder="https://..." />
                </label>
              </div>
	              <button
	                className="primary-button"
	                disabled={!deliverableDescription.trim() || (contract.payment_type === 'milestone' && !deliverableMilestoneId)}
	                onClick={() => onSubmitDeliverable(contract)}
	              >
                <Upload size={16} />
                Отправить на проверку
              </button>
            </div>
          )}

          {deliverables.length === 0 && <p className="muted">Результаты работ еще не отправлены.</p>}
          {deliverables.map((item) => (
            <div className="deliverable-card" key={item.id}>
              <div>
                <p className="muted">{new Date(item.submitted_at).toLocaleString('ru-RU')}</p>
	                <h3>{item.file_name || 'Результат работы'}</h3>
	                {item.milestone_id && (
	                  <p className="muted">
	                    Этап: {milestones.find((milestone) => milestone.id === item.milestone_id)?.title || 'не найден'}
	                  </p>
	                )}
                <p>{item.description}</p>
                {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer">Открыть файл</a>}
                {item.review_comment && <p className="review-note">Комментарий: {item.review_comment}</p>}
              </div>
              <span className="status">{item.is_approved === true ? 'принято' : item.is_approved === false ? 'доработка' : 'на проверке'}</span>
            </div>
          ))}

          {isCustomer && contract.status === 'review' && latestDeliverable && (
            <div className="submit-box">
              <h3>Проверка результата</h3>
              <label>
                Комментарий заказчика
                <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Работа принята / требуются правки..." />
              </label>
              <div className="button-row">
                <button className="primary-button" onClick={() => onApproveDeliverable(contract, latestDeliverable)}>
	                  {contract.payment_type === 'milestone' ? 'Принять этап и выплатить' : 'Принять и выплатить'}
	                </button>
                <button className="secondary-button" onClick={() => onRequestRevision(latestDeliverable)}>
                  Отправить на доработку
                </button>
              </div>
            </div>
	      )}

	      {contract.status === 'completed' && (
	        <div className="submit-box">
	          <h3>Оценка сделки</h3>
	          {hasReviewed ? (
	            <p className="muted">Вы уже оставили оценку по этой сделке.</p>
	          ) : (
	            <>
	              <div className="form-row">
	                <label>
	                  Рейтинг
	                  <select value={reviewDraft.rating} onChange={(event) => setReviewDraft({ ...reviewDraft, rating: event.target.value })}>
	                    {[5, 4, 3, 2, 1].map((rating) => (
	                      <option value={rating} key={rating}>{rating}</option>
	                    ))}
	                  </select>
	                </label>
	              </div>
	              <label>
	                Комментарий
	                <textarea value={reviewDraft.comment} onChange={(event) => setReviewDraft({ ...reviewDraft, comment: event.target.value })} />
	              </label>
	              <button className="primary-button" onClick={() => onSubmitReview(contract)}>Сохранить оценку</button>
	            </>
	          )}
	          {reviews.map((review) => (
	            <div className="review-note" key={review.id}>
	              <strong>{review.rating}/5</strong>
	              <p>{review.comment || 'Без комментария'}</p>
	            </div>
	          ))}
	        </div>
	      )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="chat-panel">
          <div className="message-list">
            {messages.length === 0 && <p className="muted">Сообщений пока нет.</p>}
            {messages.map((item) => (
              <div className={item.sender_id === userId ? 'message own' : 'message'} key={item.id}>
                <span>{item.profiles?.full_name || 'Пользователь'}</span>
                <p>{item.body}</p>
                <small>{new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input value={chatBody} onChange={(event) => setChatBody(event.target.value)} placeholder="Написать сообщение..." />
            <button className="primary-button" onClick={() => onSendMessage(contract)}>Отправить</button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="timeline">
          <HistoryItem label="Контракт создан" value={contract.id} />
          {contract.customer_signed_at && <HistoryItem label="Подписан заказчиком" value={new Date(contract.customer_signed_at).toLocaleString('ru-RU')} />}
          {contract.executor_signed_at && <HistoryItem label="Подписан исполнителем" value={new Date(contract.executor_signed_at).toLocaleString('ru-RU')} />}
          {contract.escrow_deal_id && <HistoryItem label="Escrow deal" value={contract.escrow_deal_id} />}
          {deliverables.map((item) => <HistoryItem key={item.id} label="Результат отправлен" value={new Date(item.submitted_at).toLocaleString('ru-RU')} />)}
        </div>
      )}
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-cell">
      <p className="muted">{label}</p>
      <strong>{value}</strong>
    </div>
  )
}

function HistoryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="history-item">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  )
}

function AdminView({
  profiles,
  userRoles,
  projects,
  applications,
  contracts,
  deliverables,
  messages,
  milestones,
  escrowTransactions,
  disputes,
  tags,
  projectCategories,
  currentUserId,
  reload,
  setMessage,
}: {
  profiles: Profile[]
  userRoles: UserRoleRow[]
  projects: Project[]
  applications: ApplicationRow[]
  contracts: ContractRow[]
  deliverables: DeliverableRow[]
  messages: MessageRow[]
  milestones: MilestoneRow[]
  escrowTransactions: EscrowTransactionRow[]
  disputes: DisputeRow[]
  tags: TagRow[]
  projectCategories: ProjectCategoryRow[]
  currentUserId: string
  reload: () => Promise<void>
  setMessage: (message: string) => void
}) {
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'projects' | 'contracts' | 'disputes' | 'directories'>('users')
  const [chartMetric, setChartMetric] = useState<AdminChartMetric>('contracts')
  const [chartPeriod, setChartPeriod] = useState<AdminChartPeriod>('6_months')
  const [resolutionComment, setResolutionComment] = useState('')
  const [tagName, setTagName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const completedAmount = contracts
    .filter((contract) => contract.status === 'completed')
    .reduce((sum, contract) => sum + Number(contract.total_amount), 0)
  const lockedAmount = contracts
    .filter((contract) => ['funded', 'review'].includes(contract.status))
    .reduce((sum, contract) => sum + Number(contract.total_amount), 0)

  async function setUserRole(target: Profile, nextRole: Role) {
    const { error: roleError } = await supabase.from('user_roles').upsert(
      { user_id: target.id, role: nextRole },
      { onConflict: 'user_id,role' },
    )
    if (roleError) {
      setMessage(roleError.message)
      return
    }
    const { error: profileError } = await supabase.from('profiles').update({ active_role: nextRole }).eq('id', target.id)
    if (profileError) setMessage(profileError.message)
    else {
      setMessage('Роль пользователя обновлена')
      await reload()
    }
  }

  async function updateProjectStatus(project: Project, status: string) {
    const { error } = await supabase.from('projects').update({ status }).eq('id', project.id)
    if (error) setMessage(error.message)
    else {
      setMessage('Статус проекта обновлен')
      await reload()
    }
  }

  async function updateApplicationStatus(application: ApplicationRow, status: string) {
    const { error } = await supabase.from('applications').update({ status }).eq('id', application.id)
    if (error) setMessage(error.message)
    else {
      setMessage('Статус заявки обновлен')
      await reload()
    }
  }

  async function updateContractStatus(contract: ContractRow, status: string) {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', contract.id)
    if (error) setMessage(error.message)
    else {
      setMessage('Статус контракта обновлен')
      await reload()
    }
  }

  async function resolveDispute(dispute: DisputeRow, resolution: 'customer_wins' | 'executor_wins') {
    const contract = contracts.find((item) => item.id === dispute.contract_id)
    if (!contract) {
      setMessage('Контракт по спору не найден')
      return
    }
    try {
      const txHash = resolution === 'customer_wins' ? await refund(contract.id) : await release(contract.id)
      await supabase.from('escrow_transactions').insert({
        contract_id: contract.id,
        tx_type: resolution === 'customer_wins' ? 'refund' : 'release',
        status: 'confirmed',
        amount_rub: contract.total_amount,
        native_amount: contract.escrow_native_amount,
        native_symbol: contract.escrow_native_symbol || escrowConfig.nativeSymbol,
        chain_id: escrowConfig.chainId,
        contract_address: escrowConfig.contractAddress,
        from_user_id: resolution === 'customer_wins' ? null : contract.customer_id,
        to_user_id: resolution === 'customer_wins' ? contract.customer_id : contract.executor_id,
        tx_hash: txHash,
        note: resolution === 'customer_wins' ? 'Решение спора: возврат заказчику' : 'Решение спора: выплата исполнителю',
      })
      await supabase.from('disputes').update({
        status: 'resolved',
        resolution,
        resolved_by_id: currentUserId,
        resolution_comment: resolutionComment.trim() || (resolution === 'customer_wins' ? 'Средства возвращены заказчику' : 'Сделка закрыта в пользу исполнителя'),
        resolved_at: new Date().toISOString(),
      }).eq('id', dispute.id)
      await supabase.from('contracts').update(
        resolution === 'customer_wins'
          ? { status: 'cancelled', escrow_refunded_at: new Date().toISOString() }
          : { status: 'completed', escrow_released_at: new Date().toISOString() },
      ).eq('id', contract.id)
      if (contract.project_id) {
        await supabase.from('projects').update({ status: resolution === 'customer_wins' ? 'cancelled' : 'completed' }).eq('id', contract.project_id)
      }
      await Promise.all([
        supabase.rpc('notify_user', {
          target_user_id: contract.customer_id,
          notification_type: 'dispute',
          notification_title: 'Спор решен',
          notification_body: resolution === 'customer_wins' ? 'Администратор вернул средства заказчику' : 'Администратор закрыл сделку в пользу исполнителя',
          target_table: 'disputes',
          target_id: dispute.id,
        }),
        supabase.rpc('notify_user', {
          target_user_id: contract.executor_id,
          notification_type: 'dispute',
          notification_title: 'Спор решен',
          notification_body: resolution === 'customer_wins' ? 'Администратор вернул средства заказчику' : 'Администратор закрыл сделку в пользу исполнителя',
          target_table: 'disputes',
          target_id: dispute.id,
        }),
      ])
      setResolutionComment('')
      setMessage('Спор решен, escrow-транзакция записана')
      await reload()
    } catch (error) {
      setMessage(readError(error))
    }
  }

  async function createTag(event: React.FormEvent) {
    event.preventDefault()
    const name = tagName.trim()
    if (!name) return
    const { error } = await supabase.from('tags').insert({ name, slug: slugify(name) })
    if (error) setMessage(error.message)
    else {
      setTagName('')
      setMessage('Тег добавлен')
      await reload()
    }
  }

  async function createCategory(event: React.FormEvent) {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    const { error } = await supabase.from('project_categories').insert({ name, slug: slugify(name) })
    if (error) setMessage(error.message)
    else {
      setCategoryName('')
      setMessage('Категория добавлена')
      await reload()
    }
  }

  const profileName = (id: string | null | undefined) => profiles.find((item) => item.id === id)?.full_name || 'Пользователь'
  const userRoleLabel = (id: string) => {
    const roles = userRoles.filter((item) => item.user_id === id).map((item) => item.role)
    return roles.length ? roles.join(', ') : 'нет роли'
  }
  const contractDeliverables = (contractId: string) => deliverables.filter((item) => item.contract_id === contractId)
  const contractMessages = (contractId: string) => messages.filter((item) => item.contract_id === contractId)
  const contractMilestones = (contractId: string) => milestones.filter((item) => item.contract_id === contractId)
  const contractTransactions = (contractId: string) => escrowTransactions.filter((item) => item.contract_id === contractId)
  const chartPoints = buildAdminChartPoints(chartMetric, chartPeriod, {
    profiles,
    projects,
    applications,
    contracts,
    escrowTransactions,
  })

  return (
    <section className="stack">
      <SectionTitle title="Панель администратора" />
      <div className="metric-grid">
        <Metric title="Пользователи" value={profiles.length} />
        <Metric title="Проекты" value={projects.length} />
        <Metric title="Контракты" value={contracts.length} />
        <Metric title="Escrow в работе" value={Math.round(lockedAmount)} suffix=" ₽" />
      </div>
      <div className="metric-grid">
        <Metric title="Заявки" value={applications.length} />
        <Metric title="Транзакции" value={escrowTransactions.length} />
        <Metric title="Завершено на" value={Math.round(completedAmount)} suffix=" ₽" />
        <Metric title="Теги" value={tags.length} />
      </div>

      <AdminChartPanel metric={chartMetric} setMetric={setChartMetric} period={chartPeriod} setPeriod={setChartPeriod} points={chartPoints} />

      <div className="tabbar admin-tabbar">
        <button className={activeAdminTab === 'users' ? 'active' : ''} onClick={() => setActiveAdminTab('users')}>Пользователи</button>
	        <button className={activeAdminTab === 'projects' ? 'active' : ''} onClick={() => setActiveAdminTab('projects')}>Проекты и заявки</button>
	        <button className={activeAdminTab === 'contracts' ? 'active' : ''} onClick={() => setActiveAdminTab('contracts')}>Контракты и escrow</button>
	        <button className={activeAdminTab === 'disputes' ? 'active' : ''} onClick={() => setActiveAdminTab('disputes')}>Споры</button>
	        <button className={activeAdminTab === 'directories' ? 'active' : ''} onClick={() => setActiveAdminTab('directories')}>Справочники</button>
      </div>

      {activeAdminTab === 'users' && (
        <div className="admin-table">
          <div className="admin-row admin-row-head">
            <span>Пользователь</span>
            <span>Email</span>
            <span>Роли</span>
            <span>Активная роль</span>
          </div>
          {profiles.map((item) => (
            <div className="admin-row" key={item.id}>
              <strong>{item.full_name}</strong>
              <span>{item.email}</span>
              <span>{userRoleLabel(item.id)}</span>
              <select value={item.active_role} onChange={(event) => setUserRole(item, event.target.value as Role)}>
                <option value="customer">Заказчик</option>
                <option value="executor">Исполнитель</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {activeAdminTab === 'projects' && (
        <div className="admin-grid">
          <div className="panel stack">
            <h2>Проекты</h2>
            {projects.map((project) => (
              <div className="admin-item" key={project.id}>
                <div>
                  <strong>{project.title}</strong>
                  <p>{profileName(project.customer_id)} · {Number(project.budget).toLocaleString('ru-RU')} ₽</p>
                </div>
                <select value={project.status} onChange={(event) => updateProjectStatus(project, event.target.value)}>
                  {projectStatusOptions.map((status) => <option value={status} key={status}>{projectStatusLabel(status)}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="panel stack">
            <h2>Заявки</h2>
            {applications.map((application) => (
              <div className="admin-item" key={application.id}>
                <div>
                  <strong>{application.projects?.title || 'Проект'}</strong>
                  <p>{application.profiles?.full_name || profileName(application.executor_id)} · {Number(application.proposed_price).toLocaleString('ru-RU')} ₽</p>
                </div>
                <select value={application.status} onChange={(event) => updateApplicationStatus(application, event.target.value)}>
                  {applicationStatusOptions.map((status) => <option value={status} key={status}>{applicationStatusLabel(status)}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'contracts' && (
        <div className="admin-grid">
          <div className="panel stack">
            <h2>Контракты</h2>
            {contracts.map((contract) => (
              <div className="admin-item" key={contract.id}>
                <div>
                  <strong>{contract.subject}</strong>
                  <p>{profileName(contract.customer_id)} → {profileName(contract.executor_id)} · {Number(contract.total_amount).toLocaleString('ru-RU')} ₽</p>
                </div>
                <select value={contract.status} onChange={(event) => updateContractStatus(contract, event.target.value)}>
                  {contractStatusOptions.map((status) => <option value={status} key={status}>{contractStatusLabel(status)}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="panel stack">
            <h2>Escrow-транзакции</h2>
            {escrowTransactions.map((tx) => (
              <div className="admin-item" key={tx.id}>
                <div>
                  <strong>{tx.tx_type}</strong>
                  <p>{new Date(tx.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <a href={txHashUrl(tx.tx_hash)} target="_blank" rel="noreferrer">{shortAddress(tx.tx_hash)}</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'disputes' && (
        <div className="stack">
          <div className="panel">
            <h2>Споры</h2>
          </div>
          {disputes.length === 0 && <p className="muted">Открытых споров пока нет.</p>}
          {disputes.map((dispute) => {
            const contract = contracts.find((item) => item.id === dispute.contract_id)
            const disputeDeliverables = contract ? contractDeliverables(contract.id) : []
            const disputeMessages = contract ? contractMessages(contract.id) : []
            const disputeMilestones = contract ? contractMilestones(contract.id) : []
            const disputeTransactions = contract ? contractTransactions(contract.id) : []
            return (
              <div className="panel stack dispute-panel" key={dispute.id}>
                <div className="detail-header">
                  <div>
                    <p className="muted">Спор #{dispute.id.slice(0, 8)}</p>
                    <h2>{contract?.subject || `Контракт #${dispute.contract_id.slice(0, 8)}`}</h2>
                    <p>{profileName(contract?.customer_id)} → {profileName(contract?.executor_id)}</p>
                  </div>
                  <span className="status">{disputeStatusLabel(dispute.status)}</span>
                </div>
                <div className="notice">
                  <strong>Причина спора</strong>
                  <p>{dispute.resolution_comment || 'Причина спора не указана'}</p>
                  {dispute.resolution && <p>Решение: {disputeResolutionLabel(dispute.resolution)}</p>}
                </div>
                {contract && (
                  <div className="admin-contract-sections">
                    <section className="admin-contract-section">
                      <h3>Условия</h3>
                      <div className="detail-grid">
                        <Info label="Сумма" value={`${Number(contract.total_amount).toLocaleString('ru-RU')} ₽`} />
                        <Info label="Оплата" value={contract.payment_type === 'milestone' ? 'По этапам' : 'Сразу'} />
                        <Info label="Статус" value={contractStatusLabel(contract.status)} />
                        <Info label="Срок" value={new Date(contract.deadline).toLocaleDateString('ru-RU')} />
                        <Info label="Комиссия" value={`${Number(contract.platform_fee_percent)}%`} />
                        <Info label="Приемка" value={`${contract.review_period_days} дней`} />
                        <div className="full-row">
                          <p className="muted">Условия расторжения и приемки</p>
                          <p>{contract.termination_terms}</p>
                        </div>
                      </div>
                    </section>
                    <section className="admin-contract-section">
                      <h3>Этапы</h3>
                      {disputeMilestones.length === 0 && <p className="muted">Этапы не настроены.</p>}
                      {disputeMilestones.map((milestone) => (
                        <div className="milestone-card" key={milestone.id}>
                          <div>
                            <strong>{milestone.position}. {milestone.title}</strong>
                            <p>{milestone.description || 'Описание не указано'}</p>
                          </div>
                          <div className="item-actions">
                            <strong>{Number(milestone.amount).toLocaleString('ru-RU')} ₽</strong>
                            <span className={`status status-${milestone.status}`}>{milestoneStatusLabel(milestone.status)}</span>
                          </div>
                        </div>
                      ))}
                    </section>
                    <section className="admin-contract-section">
                      <h3>Сдачи работы</h3>
                      {disputeDeliverables.length === 0 && <p className="muted">Результаты работ не прикреплены.</p>}
                      {disputeDeliverables.map((item) => (
                        <div className="deliverable-card" key={item.id}>
                          <div>
                            <p className="muted">{new Date(item.submitted_at).toLocaleString('ru-RU')}</p>
                            <h3>{item.file_name || 'Результат работы'}</h3>
                            <p>{item.description}</p>
                            {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer">Открыть файл</a>}
                            {item.review_comment && <p className="review-note">Комментарий: {item.review_comment}</p>}
                          </div>
                          <span className="status">{item.is_approved === true ? 'принято' : item.is_approved === false ? 'доработка' : 'на проверке'}</span>
                        </div>
                      ))}
                    </section>
                    <section className="admin-contract-section">
                      <h3>Чат</h3>
                      <div className="message-list admin-message-list">
                        {disputeMessages.length === 0 && <p className="muted">Сообщений нет.</p>}
                        {disputeMessages.map((item) => (
                          <div className="message" key={item.id}>
                            <span>{item.profiles?.full_name || profileName(item.sender_id)}</span>
                            <p>{item.body}</p>
                            <small>{new Date(item.created_at).toLocaleString('ru-RU')}</small>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="admin-contract-section">
                      <h3>История</h3>
                      <div className="timeline">
                        <HistoryItem label="Контракт создан" value={contract.id} />
                        {contract.customer_signed_at && <HistoryItem label="Подписан заказчиком" value={new Date(contract.customer_signed_at).toLocaleString('ru-RU')} />}
                        {contract.executor_signed_at && <HistoryItem label="Подписан исполнителем" value={new Date(contract.executor_signed_at).toLocaleString('ru-RU')} />}
                        {contract.escrow_deal_id && <HistoryItem label="Escrow deal" value={contract.escrow_deal_id} />}
                        {disputeTransactions.map((tx) => <HistoryItem key={tx.id} label={`Escrow ${tx.tx_type}`} value={tx.tx_hash} />)}
                        {disputeDeliverables.map((item) => <HistoryItem key={item.id} label="Результат отправлен" value={new Date(item.submitted_at).toLocaleString('ru-RU')} />)}
                      </div>
                    </section>
                  </div>
                )}
                {dispute.status !== 'resolved' && (
                  <div className="stack dispute-actions">
                    <textarea value={resolutionComment} onChange={(event) => setResolutionComment(event.target.value)} placeholder="Комментарий администратора" />
                    <div className="button-row">
                      <button className="secondary-button danger-button" disabled={!isEscrowReady()} onClick={() => resolveDispute(dispute, 'customer_wins')}>
                        Вернуть заказчику
                      </button>
                      <button className="primary-button" disabled={!isEscrowReady()} onClick={() => resolveDispute(dispute, 'executor_wins')}>
                        Выплатить исполнителю
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeAdminTab === 'directories' && (
        <div className="admin-grid">
          <form className="panel stack" onSubmit={createTag}>
            <h2>Теги</h2>
            <div className="form-row">
              <input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Название тега" />
              <button className="primary-button" type="submit">Добавить</button>
            </div>
            <div className="tag-list">
              {tags.map((tag) => <span className="mini-tag" key={tag.id}>{tag.name}</span>)}
            </div>
          </form>
          <form className="panel stack" onSubmit={createCategory}>
            <h2>Категории</h2>
            <div className="form-row">
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Название категории" />
              <button className="primary-button" type="submit">Добавить</button>
            </div>
            <div className="tag-list">
              {projectCategories.map((category) => <span className="mini-tag" key={category.id}>{category.name}</span>)}
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

const adminChartOptions: Array<{ value: AdminChartMetric; label: string; unit: 'count' | 'rub' }> = [
  { value: 'users', label: 'Пользователи', unit: 'count' },
  { value: 'projects', label: 'Проекты', unit: 'count' },
  { value: 'applications', label: 'Заявки', unit: 'count' },
  { value: 'contracts', label: 'Контракты', unit: 'count' },
  { value: 'deal_volume', label: 'Объем сделок', unit: 'rub' },
  { value: 'commission', label: 'Комиссия', unit: 'rub' },
  { value: 'escrow_transactions', label: 'Escrow tx', unit: 'count' },
]

const adminChartPeriodOptions: Array<{ value: AdminChartPeriod; label: string }> = [
  { value: '30_days', label: '30 дней' },
  { value: '6_months', label: '6 месяцев' },
  { value: '12_months', label: '12 месяцев' },
]

function AdminChartPanel({
  metric,
  setMetric,
  period,
  setPeriod,
  points,
}: {
  metric: AdminChartMetric
  setMetric: (metric: AdminChartMetric) => void
  period: AdminChartPeriod
  setPeriod: (period: AdminChartPeriod) => void
  points: ChartPoint[]
}) {
  const selected = adminChartOptions.find((item) => item.value === metric) || adminChartOptions[0]
  const maxValue = Math.max(...points.map((point) => point.value), 0)
  const total = points.reduce((sum, point) => sum + point.value, 0)
  const chartWidth = 640
  const chartHeight = 220
  const padding = { top: 18, right: 18, bottom: 34, left: 44 }
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom
  const linePoints = points.map((point, index) => {
    const x = padding.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
    const y = padding.top + plotHeight - (maxValue ? (point.value / maxValue) * plotHeight : 0)
    return { ...point, x, y }
  })
  const linePath = linePoints.map((point) => `${point.x},${point.y}`).join(' ')
  const labelStep = Math.max(1, Math.ceil(points.length / 6))

  return (
    <div className="panel admin-chart-panel">
      <div className="admin-chart-header">
        <div>
          <p className="muted">Аналитика платформы</p>
          <h2>{selected.label}</h2>
        </div>
        <div className="admin-chart-controls">
          <select value={metric} onChange={(event) => setMetric(event.target.value as AdminChartMetric)}>
            {adminChartOptions.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={period} onChange={(event) => setPeriod(event.target.value as AdminChartPeriod)}>
            {adminChartPeriodOptions.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="admin-chart-summary">
        <span>Итого</span>
        <strong>{formatAdminChartValue(total, selected.unit)}</strong>
      </div>
      <div className="admin-chart">
        <svg className="admin-line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${selected.label}: ${formatAdminChartValue(total, selected.unit)}`}>
          <line className="admin-chart-axis" x1={padding.left} y1={padding.top + plotHeight} x2={chartWidth - padding.right} y2={padding.top + plotHeight} />
          <line className="admin-chart-axis" x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotHeight} />
          {[0, 0.5, 1].map((ratio) => {
            const y = padding.top + plotHeight - ratio * plotHeight
            return (
              <g key={ratio}>
                <line className="admin-chart-gridline" x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} />
                <text className="admin-chart-y-label" x={padding.left - 8} y={y + 4}>{formatAdminChartValue(maxValue * ratio, selected.unit)}</text>
              </g>
            )
          })}
          {linePath && <polyline className="admin-chart-line" points={linePath} />}
          {linePoints.map((point, index) => (
            <g key={point.key}>
              <circle className="admin-chart-dot" cx={point.x} cy={point.y} r="4">
                <title>{point.label}: {formatAdminChartValue(point.value, selected.unit)}</title>
              </circle>
              {(index === 0 || index === linePoints.length - 1 || index % labelStep === 0) && (
                <text className="admin-chart-x-label" x={point.x} y={chartHeight - 8}>{point.label}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

function buildAdminChartPoints(
  metric: AdminChartMetric,
  period: AdminChartPeriod,
  data: {
    profiles: Profile[]
    projects: Project[]
    applications: ApplicationRow[]
    contracts: ContractRow[]
    escrowTransactions: EscrowTransactionRow[]
  },
): ChartPoint[] {
  const buckets = getAdminChartBuckets(period)
  const values = new Map(buckets.map((bucket) => [bucket.key, 0]))

  const addValue = (dateValue: string | undefined, value: number) => {
    if (!dateValue) return
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return
    const key = bucketKey(date, period)
    if (!values.has(key)) return
    values.set(key, (values.get(key) || 0) + value)
  }

  if (metric === 'users') {
    data.profiles.forEach((profile) => addValue(profile.created_at, 1))
  }
  if (metric === 'projects') {
    data.projects.forEach((project) => addValue(project.created_at, 1))
  }
  if (metric === 'applications') {
    data.applications.forEach((application) => addValue(application.created_at, 1))
  }
  if (metric === 'contracts') {
    data.contracts.forEach((contract) => addValue(contract.created_at, 1))
  }
  if (metric === 'deal_volume') {
    data.contracts.forEach((contract) => addValue(contract.created_at, Number(contract.total_amount)))
  }
  if (metric === 'commission') {
    data.contracts.forEach((contract) => {
      const commission = Number(contract.total_amount) * (Number(contract.platform_fee_percent) / 100)
      addValue(contract.created_at, commission)
    })
  }
  if (metric === 'escrow_transactions') {
    data.escrowTransactions.forEach((tx) => addValue(tx.created_at, 1))
  }

  return buckets.map((bucket) => ({
    ...bucket,
    value: values.get(bucket.key) || 0,
  }))
}

function getAdminChartBuckets(period: AdminChartPeriod): Array<{ key: string; label: string }> {
  const now = new Date()
  if (period === '30_days') {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - index))
      return {
        key: dayKey(date),
        label: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      }
    })
  }
  const count = period === '12_months' ? 12 : 6
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
    return {
      key: monthKey(date),
      label: date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
    }
  })
}

function bucketKey(date: Date, period: AdminChartPeriod) {
  return period === '30_days' ? dayKey(date) : monthKey(date)
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatAdminChartValue(value: number, unit: 'count' | 'rub') {
  if (unit === 'rub') {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`
  }
  return Math.round(value).toLocaleString('ru-RU')
}

function ProfileView({
  profile,
  wallets,
  contracts,
  ratings,
  reviews,
  reload,
  setMessage,
}: {
  profile: Profile
  wallets: WalletRow[]
  contracts: ContractRow[]
  ratings: RatingRow[]
  reviews: ContractReviewRow[]
  reload: () => Promise<void>
  setMessage: (message: string) => void
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    company_name: profile.company_name || '',
    specialization: profile.specialization || '',
    portfolio_url: profile.portfolio_url || '',
    bio: profile.bio || '',
  })
  const rating = ratings.find((item) => item.user_id === profile.id)
  const completedContracts = contracts.filter((contract) => contract.status === 'completed')
  const profileReviews = reviews.filter((review) => review.target_id === profile.id)

	  useEffect(() => {
	    queueMicrotask(() => {
	      setForm({
	        full_name: profile.full_name || '',
	        phone: profile.phone || '',
	        company_name: profile.company_name || '',
	        specialization: profile.specialization || '',
	        portfolio_url: profile.portfolio_url || '',
	        bio: profile.bio || '',
	      })
	    })
	  }, [profile])

  async function connect() {
    try {
      const address = await connectWallet()
      const { error } = await supabase.from('wallets').upsert(
        {
          user_id: profile.id,
          chain_id: escrowConfig.chainId,
          address,
          label: escrowConfig.chainName,
          is_primary: true,
        },
        { onConflict: 'user_id,chain_id,address' },
      )
      if (error) setMessage(error.message)
      else {
        setMessage('Кошелек подключен')
        await reload()
      }
    } catch (error) {
      setMessage(readError(error))
    }
	  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        company_name: form.company_name || null,
        specialization: form.specialization || null,
        portfolio_url: form.portfolio_url || null,
        bio: form.bio || null,
      })
      .eq('id', profile.id)
    if (error) setMessage(error.message)
    else {
      setMessage('Профиль обновлен')
      await reload()
    }
  }
	
	  return (
	    <section className="split-layout">
	      <form className="panel stack" onSubmit={saveProfile}>
	        <h2>Профиль</h2>
	        <p className="muted">{profile.email}</p>
	        <div className="metric-grid compact-metrics">
	          <Metric title="Рейтинг" value={formatRating(rating?.rating)} />
	          <Metric title="Сделок" value={completedContracts.length} />
	        </div>
	        <label>
	          Имя
	          <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
	        </label>
	        <label>
	          Телефон
	          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+7..." />
	        </label>
	        <label>
	          Компания
	          <input value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} />
	        </label>
	        <label>
	          Специализация
	          <input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder="Frontend, Solidity, UX..." />
	        </label>
	        <label>
	          Ссылка на портфолио
	          <input value={form.portfolio_url} onChange={(event) => setForm({ ...form, portfolio_url: event.target.value })} placeholder="https://..." />
	        </label>
	        <label>
	          О себе
	          <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
	        </label>
	        <button className="primary-button" type="submit">
	          Сохранить профиль
	        </button>
	        <button className="primary-button" type="button" onClick={connect}>
	          <Wallet size={18} />
	          Подключить MetaMask
	        </button>
	      </form>
	      <div className="stack">
	        <SectionTitle title="Кошельки" />
	        {wallets.map((wallet) => (
          <article className="item-card" key={wallet.id}>
            <div>
              <p className="muted">chain id {wallet.chain_id}</p>
              <h3>{shortAddress(wallet.address)}</h3>
              <code>{wallet.address}</code>
	            </div>
	          </article>
	        ))}
	        <SectionTitle title="Завершенные заказы" />
	        {completedContracts.length === 0 && <p className="muted">Завершенных сделок пока нет.</p>}
	        {completedContracts.map((contract) => (
	          <article className="item-card" key={contract.id}>
	            <div>
	              <p className="muted">#{contract.id.slice(0, 8)}</p>
	              <h3>{contract.subject}</h3>
	              <p>{contract.profiles_customer?.full_name || 'Заказчик'} → {contract.profiles_executor?.full_name || 'Исполнитель'}</p>
	            </div>
	            <div className="item-actions">
	              <strong>{Number(contract.total_amount).toLocaleString('ru-RU')} ₽</strong>
	              <span className="status status-accepted">Завершен</span>
	            </div>
	          </article>
	        ))}
	        <SectionTitle title="Отзывы" />
	        {profileReviews.length === 0 && <p className="muted">Отзывов пока нет.</p>}
	        {profileReviews.map((review) => (
	          <div className="review-note" key={review.id}>
	            <strong>{review.rating}/5</strong>
	            <p>{review.comment || 'Без комментария'}</p>
	          </div>
	        ))}
	      </div>
	    </section>
	  )
	}

function RoleSwitch({
  profile,
  userRoles,
  setProfile,
}: {
  profile: Profile
  userRoles: UserRoleRow[]
  setProfile: (profile: Profile) => void
}) {
  async function changeRole(active_role: Role) {
    const { error } = await supabase.from('profiles').update({ active_role }).eq('id', profile.id)
    if (!error) setProfile({ ...profile, active_role })
  }
  const availableRoles: Role[] = userRoles.some((item) => item.user_id === profile.id && item.role === 'admin')
    ? ['customer', 'executor', 'admin']
    : ['customer', 'executor']

  return (
    <div className="role-switch">
      {availableRoles.map((item) => (
        <button key={item} className={profile.active_role === item ? 'active' : ''} onClick={() => changeRole(item)}>
          {item === 'customer' ? 'Заказчик' : item === 'executor' ? 'Исполнитель' : 'Админ'}
        </button>
      ))}
    </div>
  )
}

function NavButton({
  id,
  tab,
  setTab,
  icon,
  label,
}: {
  id: Tab
  tab: Tab
  setTab: (tab: Tab) => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button className={tab === id ? 'nav-button active' : 'nav-button'} onClick={() => setTab(id)}>
      {icon}
      {label}
    </button>
  )
}

function Metric({ title, value, suffix = '' }: { title: string; value: React.ReactNode; suffix?: string }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}{suffix}</strong>
    </div>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="feature">
      {icon}
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
    </div>
  )
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function formatRating(value?: number | null) {
  return value ? Number(value).toFixed(1) : '0.0'
}

function txHashUrl(hash: string) {
  if (escrowConfig.chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`
  if (escrowConfig.chainId === 1) return `https://etherscan.io/tx/${hash}`
  return `https://sepolia.etherscan.io/tx/${hash}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'e')
    .replace(/[^a-z0-9а-я]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function nextDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const projectStatusOptions = ['draft', 'open', 'in_progress', 'completed', 'cancelled']
const applicationStatusOptions = ['pending', 'accepted', 'rejected', 'withdrawn']
const contractStatusOptions = ['draft', 'negotiation', 'signed', 'funded', 'in_progress', 'review', 'completed', 'disputed', 'cancelled']

function projectStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    open: 'Открыт',
    in_progress: 'В работе',
    completed: 'Завершен',
    cancelled: 'Отменен',
  }
  return labels[status] || status
}

function applicationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'На рассмотрении',
    accepted: 'Принята',
    rejected: 'Отклонена',
    withdrawn: 'Отозвана',
  }
  return labels[status] || status
}

function contractStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    negotiation: 'Согласование',
    signed: 'Подписан',
    funded: 'Escrow внесен',
    in_progress: 'В работе',
    review: 'На проверке',
    completed: 'Завершен',
    disputed: 'Спор',
    cancelled: 'Отменен',
  }
  return labels[status] || status
}

function milestoneStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    submitted: 'На проверке',
    approved: 'Оплачен',
    disputed: 'Спор',
  }
  return labels[status] || status
}

function disputeStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: 'Открыт',
    under_review: 'На рассмотрении',
    resolved: 'Решен',
  }
  return labels[status] || status
}

function disputeResolutionLabel(resolution: string) {
  const labels: Record<string, string> = {
    customer_wins: 'Возврат заказчику',
    executor_wins: 'Выплата исполнителю',
    split: 'Разделение средств',
  }
  return labels[resolution] || resolution
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('email rate limit exceeded')) {
    return 'Превышен лимит отправки писем Supabase. Подождите и повторите попытку позже либо войдите, если аккаунт уже создан.'
  }
  if (normalized.includes('for security purposes')) {
    return 'Повторная отправка доступна примерно через минуту. Подождите перед следующей попыткой.'
  }
  if (normalized.includes('email address') && normalized.includes('invalid')) {
    return 'Укажите корректный email-адрес.'
  }
  if (normalized.includes('invalid login credentials')) {
    return 'Неверный email или пароль.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Сначала подтвердите регистрацию по ссылке из письма.'
  }
  return message
}

function readError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Не удалось выполнить действие'
}

export default App
