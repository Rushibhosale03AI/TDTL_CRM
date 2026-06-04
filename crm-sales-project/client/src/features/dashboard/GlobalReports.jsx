import React, { useState, useEffect } from "react"
import { 
  BarChart3, LineChart, PieChart, TrendingUp, DollarSign, 
  Users, CheckCircle2, AlertCircle, RefreshCw, Download, Sparkles 
} from "lucide-react"
import { reportsAPI } from "../../services/api"
import { Button } from "../../components/ui/Button"

const GlobalReports = () => {
  const [reportType, setReportType] = useState("revenue")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const res = await reportsAPI.generate(reportType)
      setReportData(res.data)
    } catch (err) {
      showToast("Failed to compile custom analytics", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [reportType])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-white font-medium transition-all bg-primary border-primary/20`}>
          <CheckCircle2 className="h-5 w-5" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary animate-pulse" />
            Global Reports & Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Access enterprise custom reporting metrics, deal pipeline analytics, and employee sales volumes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setReportType("revenue")} 
            variant={reportType === "revenue" ? "default" : "outline"}
            className="font-bold flex items-center gap-2 px-4"
          >
            <DollarSign className="h-4 w-4" />
            Revenue Analytics
          </Button>
          <Button 
            onClick={() => setReportType("performance")} 
            variant={reportType === "performance" ? "default" : "outline"}
            className="font-bold flex items-center gap-2 px-4"
          >
            <Users className="h-4 w-4" />
            Rep Performance
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card border rounded-2xl p-6">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="font-medium mt-2">Compiling custom company-wide ledger databases...</span>
        </div>
      )}

      {!loading && reportData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-3 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            {reportData.reportTitle}
          </h3>

          {/* Revenue metrics display */}
          {reportType === "revenue" && reportData.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><DollarSign className="h-6 w-6" /></div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">Closed Won Revenue</span>
                  <span className="text-3xl font-black text-foreground mt-1 block">
                    ₹{reportData.metrics.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><BarChart3 className="h-6 w-6" /></div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">Pipeline Exposure</span>
                  <span className="text-3xl font-black text-foreground mt-1 block">
                    ₹{reportData.metrics.pipelineValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">Conversion Win Rate</span>
                  <span className="text-3xl font-black text-foreground mt-1 block">
                    {reportData.metrics.winRate}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown / Visual progress bar graphs */}
          {reportData.breakdown && (
            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
              <h4 className="font-bold text-lg">Category Metrics Breakdown</h4>
              <div className="space-y-4">
                {reportData.breakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{item.category || item.name}</span>
                      <span className="text-primary font-black">
                        {item.amount !== undefined ? `₹${item.amount.toLocaleString()}` : `${item.leadsCount} Leads (₹${item.revenue.toLocaleString()})`}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-foreground transition-all duration-500" 
                        style={{ width: `${Math.min((item.amount || item.revenue || 0) / 100000 * 100, 100) || 45}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalReports
