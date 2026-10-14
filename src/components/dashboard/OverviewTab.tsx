'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QrCode, Play, CheckCircle2, ExternalLink, Star, ThumbsUp, AlertTriangle } from 'lucide-react'

export interface AnalyticsData {
  scans: number
  starts: number
  completions: number
  googleClicks: number
  privateFeedbackCount: number
  startRate: number
  completionRate: number
  scanToCompletionRate: number
  googleClickRate: number
  privateFeedbackRate: number
  avgOverall: number | null
  avgFood: number | null
  avgService: number | null
  totalRatedSessions: number
  ratingDistribution: Record<number, number>
  likedCounts: Record<string, number>
  lowRatingShare: {
    overall: number
    food: number
    service: number
  }
  campaignStats: Array<{
    id: string
    name: string
    slug: string
    active: boolean
    scans: number
    completions: number
    googleClicks: number
  }>
}

interface OverviewTabProps {
  analytics: AnalyticsData
}

export default function OverviewTab({ analytics }: OverviewTabProps) {
  const {
    scans,
    starts,
    completions,
    googleClicks,
    startRate,
    completionRate,
    googleClickRate,
    avgOverall,
    avgFood,
    avgService,
    totalRatedSessions,
    ratingDistribution,
    likedCounts,
    campaignStats,
  } = analytics

  const likedKeys = [
    { key: 'cleanliness', label: 'Spotless Cleanliness' },
    { key: 'hospitality', label: 'Courteous Staff' },
    { key: 'comfort', label: 'Comfortable Bed & AC' },
    { key: 'location', label: 'Prime Location' },
    { key: 'room_service', label: 'Prompt Room Service' },
    { key: 'value', label: 'Great Value Stay' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Primary Conversion Funnel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scans */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">1. Total Scans</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{scans}</span>
              <QrCode className="w-5 h-5 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400">QR code opens on guest phones</p>
          </CardContent>
        </Card>

        {/* Starts */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">2. Quiz Starts</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{starts}</span>
              <Play className="w-5 h-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-amber-400">
              {Math.round(startRate * 100)}% Start Rate
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5">from scans</span>
          </CardContent>
        </Card>

        {/* Completions */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">3. Completed Quizzes</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{completions}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-emerald-400">
              {Math.round(completionRate * 100)}% Completion Rate
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5">from starts</span>
          </CardContent>
        </Card>

        {/* Google Clicks */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">4. Google Clicks</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white flex items-baseline justify-between">
              <span>{googleClicks}</span>
              <ExternalLink className="w-5 h-5 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-blue-400">
              {Math.round(googleClickRate * 100)}% Hand-off Rate
            </span>
            <span className="text-[11px] text-slate-400 ml-1.5">distinct diners</span>
          </CardContent>
        </Card>
      </div>

      {/* Ratings & Compliments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Ratings Breakdown */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">Experience Scores</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Based on {totalRatedSessions} completed customer sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Overall Rating</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-bold text-white">
                    {avgOverall !== null ? avgOverall.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Q1 5-Stars</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <p className="text-xs text-slate-400">Room Comfort</p>
                <p className="text-xl font-bold text-white mt-1">
                  {avgFood !== null ? avgFood.toFixed(1) : '—'}{' '}
                  <span className="text-[11px] font-normal text-slate-400">/ 5</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <p className="text-xs text-slate-400">Staff Hospitality</p>
                <p className="text-xl font-bold text-white mt-1">
                  {avgService !== null ? avgService.toFixed(1) : '—'}{' '}
                  <span className="text-[11px] font-normal text-slate-400">/ 5</span>
                </p>
              </div>
            </div>

            {/* Rating distribution bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <p className="text-xs font-medium text-slate-400">Rating Breakdown</p>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star] || 0
                const percent = totalRatedSessions > 0 ? Math.round((count / totalRatedSessions) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-slate-400">{star}★</span>
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-400">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Compliments Breakdown */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">What Customers Liked</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Aspects frequently selected during Q4
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {likedKeys.map((item) => {
                const count = likedCounts[item.key] || 0
                const percent =
                  totalRatedSessions > 0 ? Math.round((count / totalRatedSessions) * 100) : 0

                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                        {item.label}
                      </span>
                      <span className="text-white font-bold">{count} votes</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">{percent}% of completed sessions</p>
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Low Rating Share: {Math.round(analytics.lowRatingShare.overall * 100)}% of sessions gave an overall rating of 2 stars or below.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Conversion Breakdown Table */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Campaign Conversion Performance</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Performance comparison across QR placement channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Scans</th>
                  <th className="py-2.5 px-3">Completions</th>
                  <th className="py-2.5 px-3">Completion Rate</th>
                  <th className="py-2.5 px-3">Google Clicks</th>
                  <th className="py-2.5 px-3">Review Click Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {campaignStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No campaign data yet
                    </td>
                  </tr>
                ) : (
                  campaignStats.map((c) => {
                    const cRate = c.scans > 0 ? Math.round((c.completions / c.scans) * 100) : 0
                    const gRate = c.completions > 0 ? Math.round((c.googleClicks / c.completions) * 100) : 0
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">
                          {c.name}
                          <span className="block text-[11px] font-normal text-slate-400">/r/{c.slug}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              c.active
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{c.scans}</td>
                        <td className="py-3 px-3 font-semibold">{c.completions}</td>
                        <td className="py-3 px-3">{cRate}%</td>
                        <td className="py-3 px-3 font-semibold text-amber-400">{c.googleClicks}</td>
                        <td className="py-3 px-3 font-semibold text-rose-400">{gRate}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
