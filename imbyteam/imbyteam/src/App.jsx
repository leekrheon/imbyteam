import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useIssues } from './hooks/useIssues'
import { useIdeas } from './hooks/useIdeas'
import { useEvents } from './hooks/useEvents'
import { useBriefs } from './hooks/useBriefs'
import { useMessages } from './hooks/useMessages'
import { useProfiles } from './hooks/useProfiles'
import { useAttendance } from './hooks/useAttendance'
import { useNotifications } from './hooks/useNotifications'
import { useTimePolls } from './hooks/useTimePolls'
import { useBookmarks } from './hooks/useBookmarks'
import { useRatings } from './hooks/useRatings'
import Login from './components/Login'
import Workspace from './Workspace'

export default function App() {
  const { user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f9fa', fontFamily: 'sans-serif', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>IMBY</div>
      <div style={{ fontSize: 13, color: '#999' }}>로딩 중...</div>
    </div>
  )

  if (!user || !profile) return (
    <Login onSignIn={signIn} onSignUp={signUp} />
  )

  return (
    <WorkspaceWithData
      user={user}
      profile={profile}
      onSignOut={signOut}
      onUpdateProfile={updateProfile}
    />
  )
}

function WorkspaceWithData({ user, profile, onSignOut, onUpdateProfile }) {
  const { issues, addIssue, updateIssue, deleteIssue } = useIssues()
  const { ideas, comments: ideaComments, addIdea, updateIdea, addComment, deleteIdea } = useIdeas()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { briefs, addBrief, updateBrief } = useBriefs()
  const { profiles, updateWorking } = useProfiles()
  const { todayMinutes, startWork, endWork } = useAttendance(user.id)
  const { notifications, pushNotification, markRead, markAllRead, unreadCount } = useNotifications(user.id)
  const { polls: timePolls, createPoll, votePoll } = useTimePolls()
  const { bookmarks, toggleBookmark, bookmarkCount } = useBookmarks(user.id)
  const { myRatings, rateIdea } = useRatings(user.id, profile.ini)

  const [selDM, setSelDM] = useState(undefined)

  const { messages: teamMessages, sendMessage: sendTeamMessage, toggleReaction: teamReact } = useMessages(null)

  const myIni = profile.ini || profile.name?.trim().slice(0, 1) || user.id.slice(0, 4)
  const myName = profile.name || profile.email?.split('@')[0] || '팀원'

  // DM 채널 — 양쪽 모두 UUID를 사용해 채널명을 결정
  // 핵심: [내UUID, 상대UUID].sort() → 두 사람이 동일한 채널명을 계산
  // 이전 버전은 myIni(문자열) + selDM(UUID)를 섞어서 양측 채널명이 달랐음 → 수신 불가 버그
  const dmChannel = (selDM && selDM !== null && user?.id)
    ? `dm_${[user.id, selDM].sort().join('_')}`
    : undefined
  const { messages: dmMessages, sendMessage: sendDMMessage, toggleReaction: dmReact } = useMessages(dmChannel)

  async function handleSendTeam(text, refData, eventData) {
    await sendTeamMessage(text, myIni, myName, user.id, refData, eventData)
  }

  async function handleSendDM(text, refData) {
    if (selDM === null) {
      await sendTeamMessage(text, myIni, myName, user.id, refData)
    } else {
      await sendDMMessage(text, myIni, myName, user.id, refData)
      // 상대방에게 DM 알림 — selDM은 UUID이므로 p.id로 조회
      const partnerProfile = profiles.find(p => p.id === selDM)
      if (partnerProfile) {
        await pushNotification({
          kind: 'dm',
          title: text.length > 40 ? text.slice(0, 40) + '…' : text,
          ini: myIni,
          targetUserId: partnerProfile.id,
        })
      }
    }
  }

  async function handleAddIssue(issue) {
    const newIssue = await addIssue(issue)
    if (newIssue && newIssue.assignee) {
      // 담당자(ini)의 UUID를 profiles에서 조회해 알림 전송
      const assigneeProfile = profiles.find(p => p.ini === newIssue.assignee)
      if (assigneeProfile) {
        await pushNotification({
          kind: 'issue-assigned',
          title: newIssue.title,
          ini: newIssue.assignee,
          issueId: newIssue.id,
          targetUserId: assigneeProfile.id,
        })
      }
    }
    return newIssue
  }

  // 참석자 전원에게 알림
  async function handleAddEvent(event) {
    const newEvent = await addEvent(event)
    if (newEvent) {
      const attendees = newEvent.attendees || []
      for (const ini of attendees) {
        const attendeeProfile = profiles.find(p => p.ini === ini)
        if (attendeeProfile) {
          await pushNotification({
            kind: 'event-added',
            title: newEvent.title,
            ini: myIni,
            eventId: newEvent.id,
            extra: `${newEvent.date} ${newEvent.start_time}`,
            targetUserId: attendeeProfile.id,
          })
        }
      }
    }
    return newEvent
  }

  async function handleAddIdea(idea) {
    const newIdea = await addIdea({ ...idea, author_ini: myIni, author_name: myName, author_id: user.id })
    return newIdea
  }

  async function handleToggleWork() {
    if (profile.working) {
      const startMs = new Date(profile.work_started_at).getTime()
      await endWork(startMs)
      const now = new Date().toISOString()
      await updateWorking(user.id, false, now)
      await onUpdateProfile({ working: false, work_started_at: now })
    } else {
      const now = new Date().toISOString()
      await startWork(myIni)
      await updateWorking(user.id, true, now)
      await onUpdateProfile({ working: true, work_started_at: now })
    }
  }

  async function handleCreatePoll(pollData) {
    const poll = await createPoll({
      title: pollData.title,
      slots: pollData.dates.flatMap(d => pollData.times.map(t => ({ date: d, time: t, label: `${d}|${t}` }))),
      votes: { [myIni]: [] },
      created_by: user.id,
    })
    return poll
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  const TEAM = profiles.map(p => ({
    id: p.ini,      // Workspace 전체에서 ini key로 사용 (이슈 담당자, 출석 등) — 변경 금지
    uuid: p.id,     // 실제 UUID — DM 채널 계산 전용 (이 필드만 selDM에 사용)
    name: p.name,
    ini: p.ini,
    role: p.role,
    working: p.working,
    workEndedAt: !p.working ? p.work_started_at : null,
    me: p.id === user.id,
  }))

  // reactions: { "👍": ["주","소"] } → [{ e, n, mine }]
  function formatReactions(reactions) {
    if (!reactions || Object.keys(reactions).length === 0) return null
    return Object.entries(reactions).map(([e, users]) => ({
      e,
      n: users.length,
      mine: users.includes(myIni),
    }))
  }

  const chat = teamMessages.map(m => ({
    id: m.id,
    who: m.sender_name,
    ini: m.sender_ini,
    me: m.sender_ini === myIni,
    time: new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    text: m.text,
    ref: m.ref_data,
    event: m.event_data,
    reacts: formatReactions(m.reactions),
  }))

  const dmChat = dmMessages.map(m => ({
    id: m.id,
    who: m.sender_name,
    ini: m.sender_ini,
    me: m.sender_ini === myIni,
    time: new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    text: m.text,
    ref: m.ref_data,
    reacts: formatReactions(m.reactions),
  }))

  const formattedEvents = events.map(e => ({
    ...e,
    start: e.start_time,
    end: e.end_time,
    att: e.attendees,
    type: e.event_type,
    color: e.color,
  }))

  const formattedIssues = issues.map(i => ({
    ...i,
    desc: i.description,
    labels: i.labels || [],
    assignee: i.assignee || null,
  }))

  const formattedIdeas = ideas.map(i => ({
    ...i,
    author: i.author_name,
    ini: i.author_ini,
    desc: i.description,
    tags: i.tags || [],
    recBy: i.rec_by || [],
    ratingSum: i.rating_sum || 0,
    ratingCount: i.rating_count || 0,
    myRating: myRatings[i.id] || 0,
    recommended: (i.rec_by || []).includes(myIni),
    me: i.author_ini === myIni,
    comments: (ideaComments[i.id] || []).length,
  }))

  return (
    <Workspace
      myProfile={profile}
      myIni={myIni}
      myName={myName}
      userId={user.id}
      onSignOut={onSignOut}
      onUpdateProfile={onUpdateProfile}
      todayIso={todayIso}

      team={TEAM}

      issues={formattedIssues}
      onAddIssue={handleAddIssue}
      onUpdateIssue={updateIssue}
      onDeleteIssue={deleteIssue}

      ideas={formattedIdeas}
      ideaComments={ideaComments}
      onAddIdea={handleAddIdea}
      onUpdateIdea={updateIdea}
      onAddComment={addComment}
      onRateIdea={rateIdea}
      onDeleteIdea={deleteIdea}

      events={formattedEvents}
      onAddEvent={handleAddEvent}
      onUpdateEvent={updateEvent}
      onDeleteEvent={deleteEvent}

      briefs={briefs}
      onAddBrief={addBrief}
      onUpdateBrief={updateBrief}

      chat={chat}
      dmChat={dmChat}
      selDM={selDM}
      setSelDM={setSelDM}
      onSendTeam={handleSendTeam}
      onSendDM={handleSendDM}
      onAddReaction={(msgId, emoji) => teamReact(msgId, emoji, myIni)}
      onAddDMReaction={(msgId, emoji) => dmReact(msgId, emoji, myIni)}

      todayMinutes={todayMinutes}
      isWorking={profile.working || false}
      workStartedAt={profile.work_started_at}
      onToggleWork={handleToggleWork}

      notifications={notifications}
      unreadCount={unreadCount}
      onPushNotification={pushNotification}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}

      timePolls={timePolls}
      onCreatePoll={handleCreatePoll}
      onVotePoll={(pollId, slotKey) => votePoll(pollId, myIni, slotKey)}

      bookmarks={bookmarks}
      onToggleBookmark={toggleBookmark}
      bookmarkCount={bookmarkCount}
    />
  )
}
