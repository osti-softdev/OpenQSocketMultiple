using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Media;

namespace CallerApp
{
    public partial class MainForm : Form
    {
        private DateTime? currentTicketStartTime = null;
        private Dictionary<string, object> currentTicket = null;
        private object[] catalogServicesList = null;

        private System.Windows.Forms.Timer fallbackTimer;
        private System.Web.Script.Serialization.JavaScriptSerializer jsSerializer = new System.Web.Script.Serialization.JavaScriptSerializer();
        private string lastWaitingJson = "";
        private string lastHeldJson = "";
        private string lastForwardedJson = "";
        private int lastForwardedCount = 0;
        private int isFetchingQueues = 0;
        private int isCheckingTicket = 0;
        private bool isQueueCollapsed = false;
        private bool isApplyingLayout = false;
        private Button btnCollapse = null;

        public ToolTip appToolTip = new ToolTip();

        public MainForm()
        {
            InitializeComponent();
            this.DoubleBuffered = true;
            EnableDoubleBuffering(pnlServicesList);
            EnableDoubleBuffering(pnlWaitingList);
            EnableDoubleBuffering(pnlHeldList);
            EnableDoubleBuffering(pnlForwardedList);
            EnableDoubleBuffering(tabs);
            InitializeResponsiveControls();
        }

        private void InitializeResponsiveControls()
        {
            pnlServicesList.Dock = DockStyle.Fill;
            tabHome.Padding = new Padding(1);
            tabWait.Padding = new Padding(1);
            tabHeld.Padding = new Padding(1);
            tabRecv.Padding = new Padding(1);

            tabHome.Text = "Home";
            tabWait.Text = "Wait";
            tabHeld.Text = "Held";
            tabRecv.Text = "Recv";

            btnComplete.BackgroundImageLayout = ImageLayout.Zoom;
            btnHold.BackgroundImageLayout = ImageLayout.Zoom;
            btnRecall.BackgroundImageLayout = ImageLayout.Zoom;
            btnForward.BackgroundImageLayout = ImageLayout.Zoom;
            btnVoid.BackgroundImageLayout = ImageLayout.Zoom;

            btnCollapse = new Button();
            btnCollapse.BackColor = Color.WhiteSmoke;
            btnCollapse.Cursor = Cursors.Hand;
            btnCollapse.FlatAppearance.BorderSize = 0;
            btnCollapse.FlatStyle = FlatStyle.Flat;
            btnCollapse.Font = new Font("Segoe UI", 7.5F, FontStyle.Bold);
            btnCollapse.ForeColor = Color.DimGray;
            btnCollapse.Location = new Point(190, 5);
            btnCollapse.Name = "btnCollapse";
            btnCollapse.Size = new Size(20, 20);
            btnCollapse.Text = "▲";
            btnCollapse.Visible = false;
            btnCollapse.Click += delegate {
                isQueueCollapsed = !isQueueCollapsed;
                ApplyTabSettings();
            };
            this.Controls.Add(btnCollapse);

            tabs.SelectedIndexChanged += delegate {
                if (AppSettings.ServiceMode == "Single")
                {
                    ApplyTabSettings();
                }
                else
                {
                    ReflowAllCards();
                }
            };

            pnlServicesList.ClientSizeChanged += delegate { ReflowAllCards(); };
            pnlWaitingList.ClientSizeChanged += delegate { ReflowAllCards(); };
            pnlHeldList.ClientSizeChanged += delegate { ReflowAllCards(); };
            pnlForwardedList.ClientSizeChanged += delegate { ReflowAllCards(); };

            this.Resize += new EventHandler(this.MainForm_Resize);
        }

        private void MainForm_Resize(object sender, EventArgs e)
        {
            if (isApplyingLayout) return;
            if (this.WindowState == FormWindowState.Minimized) return;

            if (AppSettings.LayoutStyle == "Dynamic")
            {
                isApplyingLayout = true;
                try
                {
                    AppSettings.DynamicWidth = this.ClientSize.Width;
                    AppSettings.DynamicHeight = this.ClientSize.Height;
                    ApplyResponsiveLayout(this.ClientSize.Width, this.ClientSize.Height);
                }
                finally
                {
                    isApplyingLayout = false;
                }
            }
        }

        private static void EnableDoubleBuffering(Control ctrl)
        {
            if (ctrl == null) return;
            try
            {
                PropertyInfo prop = typeof(Control).GetProperty("DoubleBuffered", BindingFlags.Instance | BindingFlags.NonPublic);
                if (prop != null) prop.SetValue(ctrl, true, null);
            }
            catch { }
        }

        private static void ClearPanelSafely(Panel pnl)
        {
            if (pnl == null) return;
            pnl.SuspendLayout();
            try
            {
                while (pnl.Controls.Count > 0)
                {
                    Control c = pnl.Controls[0];
                    pnl.Controls.RemoveAt(0);
                    c.Dispose();
                }
            }
            finally
            {
                pnl.ResumeLayout();
            }
        }

        private void BtnRecall_Click(object sender, EventArgs e) { RecallTicket(); }
        private void BtnHold_Click(object sender, EventArgs e) { HoldTicket(); }
        private void BtnForward_Click(object sender, EventArgs e) { OpenForwardModal(); }
        private void BtnVoid_Click(object sender, EventArgs e) { OpenVoidModal(); }
        private void BtnComplete_Click(object sender, EventArgs e) { CompleteTicket(); }
        private void BtnAutoCall_Click(object sender, EventArgs e)
        {
            CallNext("auto");
        }

        private Button CreateModernButton(string text, int x, int y, int w, int h, Color bg, Color fg)
        {
            Button b = new Button();
            b.Text = text;
            b.Location = new Point(x, y);
            b.Size = new Size(w, h);
            b.BackColor = bg;
            b.ForeColor = fg;
            b.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.Cursor = Cursors.Hand;
            return b;
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            tabs.DrawMode = TabDrawMode.OwnerDrawFixed;
            tabs.DrawItem += Tabs_DrawItem;

            if (ApiClient.CurrentTeller != null)
            {
                this.Text = string.Format("{0} - Counter {1}", ApiClient.CurrentTeller["username"], ApiClient.CurrentTeller["counter_number"]);
            }

            appToolTip.Active = AppSettings.ShowTooltips;
            appToolTip.SetToolTip(btnRecall, "Recall Ticket");
            appToolTip.SetToolTip(btnHold, "Hold Ticket");
            appToolTip.SetToolTip(btnForward, "Forward Ticket");
            appToolTip.SetToolTip(btnVoid, "Void Ticket");
            appToolTip.SetToolTip(btnComplete, "Complete Ticket");
            if (btnAutoCall != null) appToolTip.SetToolTip(btnAutoCall, "Auto Call Next");
            if (btnCollapse != null) appToolTip.SetToolTip(btnCollapse, "Show / Hide Queue Tabs");

            ApplyTabSettings();
            LoadCatalogServices();

            this.BeginInvoke(new Action(delegate {
                ThreadPool.QueueUserWorkItem(delegate {
                    FetchQueues();
                });
            }));
            
            CheckCurrentTicket();

            fallbackTimer = new System.Windows.Forms.Timer();
            fallbackTimer.Interval = 3000;
            fallbackTimer.Tick += delegate {
                ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                CheckCurrentTicket();
            };
            fallbackTimer.Start();
        }

        private void Tabs_DrawItem(object sender, DrawItemEventArgs e)
        {
            TabControl tabControl = sender as TabControl;
            TabPage page = tabControl.TabPages[e.Index];
            
            using (SolidBrush brush = new SolidBrush(page.BackColor))
            {
                e.Graphics.FillRectangle(brush, e.Bounds);
            }
            
            StringFormat sf = new StringFormat();
            sf.Alignment = StringAlignment.Center;
            sf.LineAlignment = StringAlignment.Center;
            
            Rectangle textRect = e.Bounds;
            
            using (SolidBrush textBrush = new SolidBrush(page.ForeColor))
            {
                e.Graphics.DrawString(page.Text, page.Font, textBrush, textRect, sf);
            }
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (fallbackTimer != null)
            {
                fallbackTimer.Stop();
                fallbackTimer.Dispose();
            }
            durationTimer.Stop();
            if (AppSettings.LayoutStyle == "Dynamic")
            {
                AppSettings.Save();
            }
        }

        private void BtnSettings_Click(object sender, EventArgs e)
        {
            using (SettingsModal sm = new SettingsModal())
            {
                DialogResult dr = sm.ShowDialog();
                if (dr == DialogResult.OK)
                {
                    CreateServiceBoxes();
                    ApplyTabSettings();
                    appToolTip.Active = AppSettings.ShowTooltips;
                    this.TopMost = AppSettings.AlwaysOnTop;
                    lastWaitingJson = "";
                    lastHeldJson = "";
                    lastForwardedJson = "";
                    ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                }
                else if (dr == DialogResult.Abort)
                {
                    Application.Restart();
                }
            }
        }

        private void BtnHistory_Click(object sender, EventArgs e)
        {
            ThreadPool.QueueUserWorkItem(delegate
            {
                var histParams = HistoryModal.BuildHistoryQueryParams();
                object[] historyTickets = ApiClient.GetArray("/api/tickets/history", histParams);
                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.BeginInvoke(new Action(delegate
                    {
                        HistoryModal hm = new HistoryModal(historyTickets, CallSpecificTicket, OpenForwardModal);
                        hm.Show();
                    }));
                }
            });
        }

        private void ApplyTabSettings()
        {
            this.TopMost = AppSettings.AlwaysOnTop;
            if (!tabs.TabPages.Contains(tabRecv)) 
            {
                tabs.TabPages.Add(tabRecv);
            }

            isApplyingLayout = true;
            try
            {
                string style = AppSettings.LayoutStyle;
                bool isSingle = (AppSettings.ServiceMode == "Single");
                bool isHomeTab = (tabs.SelectedTab == tabHome);

                if (style != "Collapsible")
                {
                    isQueueCollapsed = false;
                }

                pnlServicesList.AutoScroll = !isSingle;

                // Single Service on Home fits strictly 1 service row (38px content);
                // Queue lists (Wait, Held, Recv) always show at least 2 items minimum (74px content).
                // Multiple Service shows 3 items (110px content).
                int contentH = isSingle ? (isHomeTab ? 38 : 74) : 110;

                int targetW = 290;
                int targetH = 237;

                if (style == "Default")
                {
                    this.MinimumSize = new Size(0, 0);
                    this.FormBorderStyle = FormBorderStyle.FixedSingle;
                    targetW = 296;
                    // Larger cards in Default mode: 1 service row = 44px, 2 queue items = 92px, 3 items = 134px
                    int defContentH = isSingle ? (isHomeTab ? 44 : 92) : 134;
                    int tabsH = 27 + defContentH;
                    targetH = 31 + tabsH + 3 + 44 + 42;
                    this.ClientSize = new Size(targetW, targetH);
                }
                else if (style == "Grid")
                {
                    this.MinimumSize = new Size(0, 0);
                    this.FormBorderStyle = FormBorderStyle.FixedSingle;
                    targetW = 192;
                    int tabsH = 44 + contentH;
                    targetH = 26 + tabsH + 2 + 40 + 68;
                    this.ClientSize = new Size(targetW, targetH);
                }
                else if (style == "Collapsible")
                {
                    this.MinimumSize = new Size(0, 0);
                    this.FormBorderStyle = FormBorderStyle.FixedSingle;
                    targetW = 192;
                    int tabsH = 44 + contentH;
                    targetH = isQueueCollapsed ? 138 : (26 + tabsH + 2 + 40 + 68);
                    this.ClientSize = new Size(targetW, targetH);
                }
                else if (style == "Dynamic")
                {
                    this.FormBorderStyle = FormBorderStyle.Sizable;
                    // Smallest width where all 5 action buttons (33x30), all 4 tabs, and Set/Hist/Auto sit in 1 row each
                    int minClientW = 196;
                    int minContentH = isSingle ? (isHomeTab ? 38 : 74) : 74;
                    int minClientH = 26 + (24 + minContentH) + 2 + 40 + 34;
                    int borderW = this.Width - this.ClientSize.Width;
                    int borderH = this.Height - this.ClientSize.Height;
                    this.MinimumSize = new Size(minClientW + borderW, minClientH + borderH);

                    targetW = AppSettings.DynamicWidth >= minClientW ? AppSettings.DynamicWidth : minClientW;
                    targetH = (AppSettings.DynamicHeight >= minClientH && !isSingle) ? AppSettings.DynamicHeight : minClientH;
                    this.ClientSize = new Size(targetW, targetH);
                }

                ApplyResponsiveLayout(this.ClientSize.Width, this.ClientSize.Height);
            }
            finally
            {
                isApplyingLayout = false;
            }
        }

        private void ApplyResponsiveLayout(int clientW, int clientH)
        {
            this.SuspendLayout();
            tabs.SuspendLayout();
            try
            {
                string style = AppSettings.LayoutStyle;
                // Grid & Collapsible use 2x2 tabs and 3x2 action buttons; Default & Dynamic keep 1 row each
                bool isGrid = (style == "Grid" || style == "Collapsible");
                bool isDefaultLarge = (style == "Default" || clientW >= 255);
                bool isCompactRow = (!isDefaultLarge && clientW < 240);
                bool showCollapseBtn = (style == "Collapsible");
                int pad = isDefaultLarge ? 4 : 3;
                int topY = 5;
                int topH = isDefaultLarge ? 24 : 20;
                int availTopW = clientW - (pad * 2);

                Font topBtnFont = new Font("Segoe UI", isDefaultLarge ? 9F : 8F, FontStyle.Bold);
                btnSettings.Font = topBtnFont;
                btnHistory.Font = topBtnFont;
                btnAutoCall.Font = new Font("Segoe UI", isDefaultLarge ? 8.5F : 7.5F, FontStyle.Bold);

                if (btnCollapse != null)
                {
                    btnCollapse.Visible = showCollapseBtn;
                    btnCollapse.Text = isQueueCollapsed ? "▼" : "▲";
                }

                if (showCollapseBtn && btnCollapse != null)
                {
                    int collapseW = 22;
                    int remW = availTopW - collapseW - (pad * 3);
                    int w1 = remW / 3;
                    int w2 = remW / 3;
                    int w3 = remW - w1 - w2;

                    btnSettings.Text = "⚙ Set";
                    btnHistory.Text = "📜 Hist";
                    btnAutoCall.Text = "⚡ Auto";

                    btnSettings.SetBounds(pad, topY, w1, topH);
                    btnHistory.SetBounds(pad + w1 + pad, topY, w2, topH);
                    btnAutoCall.SetBounds(pad + w1 + pad + w2 + pad, topY, w3, topH);
                    btnCollapse.SetBounds(clientW - pad - collapseW, topY, collapseW, topH);
                }
                else
                {
                    int remW = availTopW - (pad * 2);
                    int w1, w2, w3;
                    if (isCompactRow)
                    {
                        btnSettings.Text = "⚙ Set";
                        btnHistory.Text = "📜 Hist";
                        btnAutoCall.Text = "⚡ Auto";
                        w1 = remW / 3;
                        w2 = remW / 3;
                        w3 = remW - w1 - w2;
                    }
                    else
                    {
                        btnSettings.Text = "⚙ Settings";
                        btnHistory.Text = "📜 History";
                        btnAutoCall.Text = "⚡ Auto";
                        w1 = (int)(remW * 0.34);
                        w2 = (int)(remW * 0.38);
                        w3 = remW - w1 - w2;
                    }
                    btnSettings.SetBounds(pad, topY, w1, topH);
                    btnHistory.SetBounds(pad + w1 + pad, topY, w2, topH);
                    btnAutoCall.SetBounds(pad + w1 + pad + w2 + pad, topY, w3, topH);
                }

                int bottomActionsH = isGrid ? 68 : (isDefaultLarge ? 42 : 34);
                int statusBlockH = isDefaultLarge ? 44 : 40;
                int bottomSectionH = statusBlockH + bottomActionsH;
                int statusY;

                // Shrink/resize cards BEFORE resizing tabs so shrinking the window never triggers a horizontal scrollbar
                ReflowAllCards(clientW);

                if (isQueueCollapsed)
                {
                    tabs.Visible = false;
                    statusY = topY + topH + 3;
                }
                else
                {
                    tabs.Visible = true;
                    int tabsX = isDefaultLarge ? 4 : 3;
                    int tabsY = topY + topH + 2;
                    int tabsW = clientW - (tabsX * 2);
                    int tabsH = Math.Max(58, clientH - tabsY - bottomSectionH - 2);

                    Font tabFont = new Font("Segoe UI", isDefaultLarge ? 8.75F : (isCompactRow ? 7.25F : 8F), isDefaultLarge ? FontStyle.Bold : FontStyle.Regular);
                    tabs.Font = tabFont;
                    tabHome.Font = tabFont;
                    tabWait.Font = tabFont;
                    tabHeld.Font = tabFont;
                    tabRecv.Font = tabFont;

                    if (isGrid)
                    {
                        tabs.Multiline = true;
                        tabs.SizeMode = TabSizeMode.Fixed;
                        tabs.ItemSize = new Size(Math.Max(50, (tabsW - 8) / 2), 20);
                    }
                    else
                    {
                        tabs.Multiline = false;
                        tabs.SizeMode = TabSizeMode.Fixed;
                        int tabItemH = isDefaultLarge ? 22 : 20;
                        tabs.ItemSize = new Size(Math.Max(43, (tabsW - 8) / 4), tabItemH);
                    }

                    tabs.SetBounds(tabsX, tabsY, tabsW, tabsH);
                    statusY = tabs.Bottom + 2;
                }

                // Position Status labels
                int leftColW = Math.Max(66, (int)(clientW * 0.42));
                lblShortSname.Font = new Font("Segoe UI", isDefaultLarge ? 10F : 9F, FontStyle.Bold);
                lblShortSname.SetBounds(4, statusY, leftColW, isDefaultLarge ? 20 : 18);
                lblDuration.Font = new Font("Segoe UI", isDefaultLarge ? 11F : (isCompactRow ? 9F : 10F), FontStyle.Bold);
                lblDuration.SetBounds(4, statusY + (isDefaultLarge ? 21 : 18), leftColW, isDefaultLarge ? 22 : 20);
                lblCurrentTicket.Font = new Font("Segoe UI", isDefaultLarge ? 22F : (isCompactRow ? 16F : 20F), FontStyle.Bold);
                lblCurrentTicket.SetBounds(leftColW + 4, statusY + 2, clientW - leftColW - 8, isDefaultLarge ? 40 : 36);

                // Position Bottom Action Buttons
                int actionsY = statusY + statusBlockH;
                if (isGrid)
                {
                    int gridPad = 4;
                    int colGap = 5;
                    int rowGap = 4;
                    int btnH = 30;
                    int colW = Math.Max(33, (clientW - (gridPad * 2) - (colGap * 2)) / 3);
                    int col1X = gridPad;
                    int col2X = gridPad + colW + colGap;
                    int col3X = gridPad + (colW + colGap) * 2;
                    int col3W = Math.Max(33, clientW - gridPad - col3X);

                    btnRecall.SetBounds(col1X, actionsY, colW, btnH);
                    btnHold.SetBounds(col2X, actionsY, colW, btnH);
                    btnVoid.SetBounds(col1X, actionsY + btnH + rowGap, colW, btnH);
                    btnForward.SetBounds(col2X, actionsY + btnH + rowGap, colW, btnH);
                    btnComplete.SetBounds(col3X, actionsY, col3W, (btnH * 2) + rowGap);
                }
                else
                {
                    int btnH = isDefaultLarge ? 36 : 30;
                    int btnW = isDefaultLarge ? 42 : 33;
                    int rowPad = isDefaultLarge ? 14 : (clientW < 215 ? 5 : 10);
                    int totalSpan = clientW - (rowPad * 2);
                    int step = (totalSpan - btnW) / 4;

                    btnRecall.SetBounds(rowPad, actionsY, btnW, btnH);
                    btnVoid.SetBounds(rowPad + step, actionsY, btnW, btnH);
                    btnForward.SetBounds(rowPad + (step * 2), actionsY, btnW, btnH);
                    btnHold.SetBounds(rowPad + (step * 3), actionsY, btnW, btnH);
                    btnComplete.SetBounds(clientW - rowPad - btnW, actionsY, btnW, btnH);
                }

                ReflowAllCards(clientW);
                tabs.Invalidate();
            }
            finally
            {
                tabs.ResumeLayout();
                this.ResumeLayout();
            }
        }

        private int GetTargetCardWidth(FlowLayoutPanel pnl, int overrideClientW = 0)
        {
            int cW = overrideClientW > 0 ? overrideClientW : this.ClientSize.Width;
            bool isDefaultLarge = (AppSettings.LayoutStyle == "Default" || cW >= 255);
            int tabsW = cW - (isDefaultLarge ? 8 : 6);
            int tabInnerW = tabsW - 10;
            // Always reserve space on the right for the vertical scrollbar so horizontal scroll (scroll X) never appears
            int safeW = tabInnerW - SystemInformation.VerticalScrollBarWidth - 6;
            return Math.Max(136, safeW);
        }

        private void LayoutServiceRowControls(Panel pRow, int cardW)
        {
            bool isLarge = (AppSettings.LayoutStyle == "Default" || cardW >= 220);
            pRow.Width = cardW;
            pRow.Height = isLarge ? 38 : 32;
            pRow.Margin = new Padding(1);
            if (pRow.Controls.Count >= 4)
            {
                Control lblName = pRow.Controls[0];
                Control lblLast = pRow.Controls[1];
                Control btnReg = pRow.Controls[2];
                Control btnPri = pRow.Controls[3];

                lblName.Font = new Font("Segoe UI", isLarge ? 9.25F : 7.5F, FontStyle.Bold);
                lblLast.Font = new Font("Segoe UI", isLarge ? 9.25F : 7.5F, FontStyle.Bold);
                btnReg.Font = new Font("Segoe UI", isLarge ? 9.5F : 8.5F, FontStyle.Bold);
                btnPri.Font = new Font("Segoe UI", isLarge ? 9.5F : 8.5F, FontStyle.Bold);

                int btnW = isLarge ? 46 : (cardW < 165 ? 26 : 38);
                int btnH = isLarge ? 30 : 26;
                int btnY = isLarge ? 4 : 3;
                int lastW = isLarge ? 44 : (cardW < 165 ? 26 : 34);
                int priX = cardW - btnW - (isLarge ? 3 : 2);
                int regX = priX - btnW - (isLarge ? 3 : 2);
                int lastX = regX - lastW - 2;
                lblName.SetBounds(3, isLarge ? 4 : 2, Math.Max(36, lastX - 3), isLarge ? 30 : 28);
                lblLast.SetBounds(lastX, isLarge ? 4 : 2, lastW, isLarge ? 30 : 28);
                btnReg.SetBounds(regX, btnY, btnW, btnH);
                btnPri.SetBounds(priX, btnY, btnW, btnH);
            }
        }

        private void LayoutQueueCardControls(Panel p, int cardW)
        {
            bool isLarge = (AppSettings.LayoutStyle == "Default" || cardW >= 220);
            p.Width = cardW;
            p.Height = isLarge ? 42 : 34;
            p.Margin = new Padding(1);
            List<Button> btns = new List<Button>();
            List<Label> lbls = new List<Label>();
            foreach (Control c in p.Controls)
            {
                if (c is Button) btns.Add((Button)c);
                else if (c is Label) lbls.Add((Label)c);
            }
            int textMaxRight = cardW - 45;
            if (btns.Count == 2)
            {
                int bW = isLarge ? 54 : (cardW < 170 ? 32 : 42);
                int bH = isLarge ? 32 : 26;
                int bY = isLarge ? 4 : 3;
                int b2X = cardW - bW - (isLarge ? 4 : 2);
                int b1X = b2X - bW - (isLarge ? 4 : 2);
                btns[0].Font = new Font("Segoe UI", isLarge ? 8.25F : 6.5F, FontStyle.Bold);
                btns[1].Font = new Font("Segoe UI", isLarge ? 8.25F : 6.5F, FontStyle.Bold);
                btns[0].SetBounds(b1X, bY, bW, bH);
                btns[1].SetBounds(b2X, bY, bW, bH);
                if (cardW < 170)
                {
                    btns[0].Text = btns[0].Text.Replace("📢 ", "").Replace("▶ ", "");
                    btns[1].Text = btns[1].Text.Replace("➡️ ", "");
                }
                textMaxRight = b1X - 3;
            }
            else if (btns.Count == 1)
            {
                int bW = isLarge ? 68 : (cardW < 170 ? 38 : 50);
                int bH = isLarge ? 32 : 26;
                int bY = isLarge ? 4 : 3;
                int b1X = cardW - bW - (isLarge ? 4 : 2);
                btns[0].Font = new Font("Segoe UI", isLarge ? 8.75F : 7.5F, FontStyle.Bold);
                btns[0].SetBounds(b1X, bY, bW, bH);
                if (cardW < 170)
                {
                    btns[0].Text = btns[0].Text.Replace("📢 ", "");
                }
                textMaxRight = b1X - 3;
            }

            if (lbls.Count >= 2)
            {
                int availTextW = Math.Max(36, textMaxRight - 3);
                lbls[0].Font = new Font("Segoe UI", isLarge ? 9.5F : 8F, FontStyle.Bold);
                lbls[0].AutoSize = false;
                lbls[0].AutoEllipsis = true;
                lbls[0].SetBounds(3, isLarge ? 2 : 1, availTextW, isLarge ? 19 : 15);

                lbls[1].Font = new Font("Segoe UI", isLarge ? 8.25F : 7F, FontStyle.Regular);
                lbls[1].AutoSize = false;
                lbls[1].AutoEllipsis = true;
                lbls[1].SetBounds(3, isLarge ? 21 : 16, availTextW, isLarge ? 17 : 14);
            }
        }

        private void ReflowPanel(FlowLayoutPanel pnl, bool isService, int overrideClientW = 0)
        {
            if (pnl == null) return;
            int cardW = GetTargetCardWidth(pnl, overrideClientW);
            pnl.SuspendLayout();
            try
            {
                foreach (Control c in pnl.Controls)
                {
                    if (c is Panel)
                    {
                        if (isService) LayoutServiceRowControls((Panel)c, cardW);
                        else LayoutQueueCardControls((Panel)c, cardW);
                    }
                }
                pnl.HorizontalScroll.Maximum = 0;
                pnl.HorizontalScroll.Visible = false;
            }
            finally
            {
                pnl.ResumeLayout(true);
                if (pnl.HorizontalScroll.Visible)
                {
                    pnl.AutoScroll = false;
                    pnl.AutoScroll = true;
                }
            }
        }

        private void ReflowAllCards(int overrideClientW = 0)
        {
            ReflowPanel(pnlServicesList, true, overrideClientW);
            ReflowPanel(pnlWaitingList, false, overrideClientW);
            ReflowPanel(pnlHeldList, false, overrideClientW);
            ReflowPanel(pnlForwardedList, false, overrideClientW);
        }

        // --- DATA LOADING ---

        private void LoadCatalogServices()
        {
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                var response = ApiClient.Get<Dictionary<string, object>>("/api/services");
                if (response != null && response.ContainsKey("data") && response["data"] is System.Collections.ArrayList)
                {
                    catalogServicesList = ((System.Collections.ArrayList)response["data"]).ToArray();
                }
                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.BeginInvoke(new Action(delegate { CreateServiceBoxes(); }));
                }
            });
        }

        private Dictionary<string, Button[]> serviceButtons = new Dictionary<string, Button[]>();
        private Dictionary<string, Label> serviceLastLabels = new Dictionary<string, Label>();

        private void CreateServiceBoxes()
        {
            if (ApiClient.CurrentTeller == null || !ApiClient.CurrentTeller.ContainsKey("services")) return;
            string[] services = ApiClient.CurrentTeller["services"].ToString().Split(',');

            ClearPanelSafely(pnlServicesList);
            serviceButtons.Clear();
            serviceLastLabels.Clear();

            pnlServicesList.SuspendLayout();
            try
            {
                foreach (string rawSrv in services)
                {
                    string srv = rawSrv.Trim();
                    if (string.IsNullOrEmpty(srv)) continue;

                    string displaySrv = srv;
                    if (catalogServicesList != null)
                    {
                        foreach (Dictionary<string, object> cat in catalogServicesList)
                        {
                            if (cat.ContainsKey("sname") && cat["sname"].ToString().Equals(srv, StringComparison.InvariantCultureIgnoreCase))
                            {
                                if (cat.ContainsKey("shortSname") && cat["shortSname"] != null && !string.IsNullOrEmpty(cat["shortSname"].ToString()))
                                {
                                    displaySrv = cat["shortSname"].ToString();
                                }
                                break;
                            }
                        }
                    }
                    displaySrv = displaySrv.Replace("_", " ");

                    Panel pRow = new Panel() { Width = 235, Height = 34, Margin = new Padding(2) };
                    
                    Label lblName = new Label() { 
                        Text = displaySrv, 
                        Font = new Font("Segoe UI", 7.5f, FontStyle.Bold), 
                        Location = new Point(2, 2), 
                        Size = new Size(82, 30),
                        AutoSize = false,
                        TextAlign = ContentAlignment.MiddleLeft,
                        ForeColor = Color.DimGray 
                    };

                    Label lblLast = new Label() { 
                        Text = "---", 
                        Font = new Font("Segoe UI", 7.5f, FontStyle.Bold), 
                        Location = new Point(84, 2), 
                        Size = new Size(44, 30),
                        AutoSize = false,
                        TextAlign = ContentAlignment.MiddleCenter,
                        ForeColor = Color.FromArgb(46, 204, 113) 
                    };
                    
                    string capturedSrv = srv;
                    Button btnReg = CreateModernButton("0", 140, 4, 45, 36, Color.FromArgb(52, 152, 219), Color.White);
                    btnReg.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
                    btnReg.Click += delegate { CallNext("regular", capturedSrv); };

                    Button btnPri = CreateModernButton("0", 190, 4, 45, 36, Color.FromArgb(155, 89, 182), Color.White);
                    btnPri.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
                    btnPri.Click += delegate { CallNext("priority", capturedSrv); };
                    
                    appToolTip.SetToolTip(btnReg, "Regular");
                    appToolTip.SetToolTip(btnPri, "Priority");

                    pRow.Controls.Add(lblName);
                    pRow.Controls.Add(lblLast);
                    pRow.Controls.Add(btnReg);
                    pRow.Controls.Add(btnPri);
                    LayoutServiceRowControls(pRow, GetTargetCardWidth(pnlServicesList));

                    pnlServicesList.Controls.Add(pRow);
                    
                    serviceButtons[srv] = new Button[] { btnReg, btnPri };
                    serviceLastLabels[srv] = lblLast;
                    if (AppSettings.ServiceMode == "Single") break;
                }
            }
            finally
            {
                pnlServicesList.ResumeLayout();
            }
        }

        private void UpdateServiceCounts(object[] tickets)
        {
            Dictionary<string, int> regCounts = new Dictionary<string, int>();
            Dictionary<string, int> priCounts = new Dictionary<string, int>();

            if (tickets != null)
            {
                foreach (Dictionary<string, object> t in tickets)
                {
                    string sname = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
                    if (string.IsNullOrEmpty(sname) && t.ContainsKey("ticketservice")) 
                        sname = t["ticketservice"].ToString();
                    
                    int priority = 0;
                    if (t.ContainsKey("priority"))
                        priority = Convert.ToInt32(t["priority"]);

                    if (priority == 1)
                    {
                        if (!priCounts.ContainsKey(sname)) priCounts[sname] = 0;
                        priCounts[sname]++;
                    }
                    else
                    {
                        if (!regCounts.ContainsKey(sname)) regCounts[sname] = 0;
                        regCounts[sname]++;
                    }
                }
            }

            foreach (var kvp in serviceButtons)
            {
                string srv = kvp.Key.Trim();
                string srvSpace = srv.Replace("_", " ");
                string srvShort = srv;
                if (catalogServicesList != null)
                {
                    foreach (Dictionary<string, object> cat in catalogServicesList)
                    {
                        if (cat.ContainsKey("sname") && cat["sname"].ToString().Trim().Replace("_", " ").Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase))
                        {
                            if (cat.ContainsKey("shortSname") && cat["shortSname"] != null && !string.IsNullOrEmpty(cat["shortSname"].ToString()))
                            {
                                srvShort = cat["shortSname"].ToString().Trim();
                            }
                            break;
                        }
                    }
                }
                string srvShortSpace = srvShort.Replace("_", " ");

                int rCount = 0;
                int pCount = 0;
                
                foreach (var rK in regCounts.Keys)
                {
                    string rKSpace = rK.Trim().Replace("_", " ");
                    if (rKSpace.Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase) || rKSpace.StartsWith(srvSpace, StringComparison.InvariantCultureIgnoreCase) || srvSpace.StartsWith(rKSpace, StringComparison.InvariantCultureIgnoreCase) ||
                        rKSpace.Equals(srvShortSpace, StringComparison.InvariantCultureIgnoreCase) || rKSpace.StartsWith(srvShortSpace, StringComparison.InvariantCultureIgnoreCase) || srvShortSpace.StartsWith(rKSpace, StringComparison.InvariantCultureIgnoreCase))
                    {
                        rCount += regCounts[rK];
                    }
                }
                foreach (var pK in priCounts.Keys)
                {
                    string pKSpace = pK.Trim().Replace("_", " ");
                    if (pKSpace.Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase) || pKSpace.StartsWith(srvSpace, StringComparison.InvariantCultureIgnoreCase) || srvSpace.StartsWith(pKSpace, StringComparison.InvariantCultureIgnoreCase) ||
                        pKSpace.Equals(srvShortSpace, StringComparison.InvariantCultureIgnoreCase) || pKSpace.StartsWith(srvShortSpace, StringComparison.InvariantCultureIgnoreCase) || srvShortSpace.StartsWith(pKSpace, StringComparison.InvariantCultureIgnoreCase))
                    {
                        pCount += priCounts[pK];
                    }
                }

                kvp.Value[0].Text = rCount.ToString();
                kvp.Value[1].Text = pCount.ToString();
            }
        }

        private void FetchQueues()
        {
            if (ApiClient.CurrentTeller == null) return;
            if (Interlocked.CompareExchange(ref isFetchingQueues, 1, 0) != 0) return;

            try
            {
                string services = ApiClient.CurrentTeller["services"].ToString();
                string tellerId = ApiClient.CurrentTeller["id"].ToString();
                string groupId = (ApiClient.CurrentTeller.ContainsKey("group_id") && ApiClient.CurrentTeller["group_id"] != null)
                    ? ApiClient.CurrentTeller["group_id"].ToString()
                    : "";

                var waitingParams = new Dictionary<string, string> { { "services", services }, { "tellerId", tellerId }, { "groupId", groupId } };
                object[] waitingTickets = ApiClient.GetArray("/api/tickets/waiting", waitingParams);

                var heldParams = new Dictionary<string, string> { { "tellerId", ApiClient.CurrentTeller["counter_number"].ToString() } };
                object[] heldTickets = ApiClient.GetArray("/api/tickets/held", heldParams);

                var forwardParams = new Dictionary<string, string> { { "tellerId", tellerId }, { "groupId", groupId } };
                object[] forwardedTickets = ApiClient.GetArray("/api/tickets/forwarded", forwardParams);

                object[] lastCalledTickets = ApiClient.GetArray("/api/tickets/last_called");

                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.BeginInvoke(new Action(delegate
                    {
                        try
                        {
                            if (AppSettings.ShowReceivedInWaiting)
                            {
                                var merged = new List<object>();
                                if (forwardedTickets != null) merged.AddRange(forwardedTickets);
                                if (waitingTickets != null) merged.AddRange(waitingTickets);
                                
                                var uniqueMerged = merged
                                    .Select(t => (Dictionary<string, object>)t)
                                    .GroupBy(t => t.ContainsKey("id") ? t["id"].ToString() : Guid.NewGuid().ToString())
                                    .Select(g => g.First())
                                    .Cast<object>()
                                    .ToArray();

                                UpdateWaitingQueue(uniqueMerged);
                            }
                            else
                            {
                                var pureWaiting = waitingTickets != null ? waitingTickets.Where(t => {
                                    var dict = (Dictionary<string, object>)t;
                                    string stat = dict.ContainsKey("status") ? dict["status"].ToString() : "";
                                    return stat != "received" && stat != "forwarded";
                                }).ToArray() : null;
                                UpdateWaitingQueue(pureWaiting);
                            }
                            
                            UpdateForwardedQueue(forwardedTickets);
                            UpdateHeldQueue(heldTickets);
                            UpdateServiceCounts(waitingTickets);
                            UpdateLastCalledTickets(lastCalledTickets);
                        }
                        catch { }
                    }));
                }
            }
            finally
            {
                Interlocked.Exchange(ref isFetchingQueues, 0);
            }
        }

        private void UpdateLastCalledTickets(object[] tickets)
        {
            if (tickets == null) return;
            foreach (Dictionary<string, object> t in tickets)
            {
                string sname = t.ContainsKey("sname") ? t["sname"].ToString().Trim() : "";
                if (string.IsNullOrEmpty(sname) && t.ContainsKey("ticketservice")) sname = t["ticketservice"].ToString().Trim();
                
                string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : (t.ContainsKey("ticketnum") ? t["ticketnum"].ToString() : "");
                
                foreach (var srvKey in serviceLastLabels.Keys)
                {
                    string srvTrim = srvKey.Trim();
                    string srvSpace = srvTrim.Replace("_", " ");
                    string srvShort = srvTrim;
                    if (catalogServicesList != null)
                    {
                        foreach (Dictionary<string, object> cat in catalogServicesList)
                        {
                            if (cat.ContainsKey("sname") && cat["sname"].ToString().Trim().Replace("_", " ").Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase))
                            {
                                if (cat.ContainsKey("shortSname") && cat["shortSname"] != null && !string.IsNullOrEmpty(cat["shortSname"].ToString()))
                                {
                                    srvShort = cat["shortSname"].ToString().Trim();
                                }
                                break;
                            }
                        }
                    }
                    string srvShortSpace = srvShort.Replace("_", " ");
                    string snameSpace = sname.Replace("_", " ");

                    if (snameSpace.Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase) || snameSpace.StartsWith(srvSpace, StringComparison.InvariantCultureIgnoreCase) || srvSpace.StartsWith(snameSpace, StringComparison.InvariantCultureIgnoreCase) ||
                        snameSpace.Equals(srvShortSpace, StringComparison.InvariantCultureIgnoreCase) || snameSpace.StartsWith(srvShortSpace, StringComparison.InvariantCultureIgnoreCase) || srvShortSpace.StartsWith(snameSpace, StringComparison.InvariantCultureIgnoreCase))
                    {
                        serviceLastLabels[srvKey].Text = tNum;
                        break;
                    }
                }
            }
        }

        private void UpdateWaitingQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastWaitingJson) return;
            lastWaitingJson = newJson;

            ClearPanelSafely(pnlWaitingList);
            pnlWaitingList.SuspendLayout();
            int count = 0;
            try
            {
                if (tickets != null)
                {
                    var sortedTickets = tickets
                        .Select(t => (Dictionary<string, object>)t)
                        .OrderByDescending(t => t.ContainsKey("status") && t["status"].ToString() == "received" ? 1 : 0)
                        .ThenByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                        .ThenBy(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                        .ToList();

                    foreach (var t in sortedTickets)
                    {
                        count++;
                        string tId = t["id"].ToString();
                        Panel pItem = CreateQueueItem(t, "📢 Call", Color.FromArgb(52, 152, 219), delegate { CallSpecificTicket(tId); });
                        pnlWaitingList.Controls.Add(pItem);
                    }
                }
            }
            finally
            {
                pnlWaitingList.ResumeLayout();
            }
            tabWait.Text = string.Format("Wait ({0})", count);
            tabWait.BackColor = count > 0 ? Color.LightCoral : Color.White;
            ReflowPanel(pnlWaitingList, false);
            tabs.Invalidate();
        }

        private void UpdateHeldQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastHeldJson) return;
            lastHeldJson = newJson;

            ClearPanelSafely(pnlHeldList);
            pnlHeldList.SuspendLayout();
            int count = 0;
            try
            {
                if (tickets != null)
                {
                    var sortedTickets = tickets
                        .Select(t => (Dictionary<string, object>)t)
                        .OrderByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                        .ThenBy(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                        .ToList();
                    foreach (var t in sortedTickets)
                    {
                        count++;
                        string tId = t["id"].ToString();
                        Panel pItem = CreateQueueItem(t, 
                            "▶ Res", Color.FromArgb(46, 204, 113), delegate { ResumeHeldTicket(tId); },
                            "➡️ Fwd", Color.FromArgb(149, 165, 166), delegate { OpenForwardModal(tId); });
                        pnlHeldList.Controls.Add(pItem);
                    }
                }
            }
            finally
            {
                pnlHeldList.ResumeLayout();
            }
            tabHeld.Text = string.Format("Held ({0})", count);
            tabHeld.BackColor = count > 0 ? Color.Yellow : Color.White;
            ReflowPanel(pnlHeldList, false);
            tabs.Invalidate();
        }

        private void UpdateForwardedQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastForwardedJson) return;

            int currentLength = tickets != null ? tickets.Length : 0;
            if (lastForwardedJson != "" && currentLength > lastForwardedCount)
            {
                PlayCustomSound("received");
            }
            lastForwardedCount = currentLength;
            lastForwardedJson = newJson;

            ClearPanelSafely(pnlForwardedList);
            pnlForwardedList.SuspendLayout();
            int count = 0;
            try
            {
                if (tickets != null)
                {
                    var sortedTickets = tickets
                        .Select(t => (Dictionary<string, object>)t)
                        .OrderByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                        .ThenBy(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                        .ToList();
                    foreach (var t in sortedTickets)
                    {
                        count++;
                        string tId = t["id"].ToString();
                        Panel pItem = CreateQueueItem(t, 
                            "📢 Call", Color.FromArgb(155, 89, 182), delegate { CallSpecificTicket(tId); },
                            "➡️ Fwd", Color.FromArgb(149, 165, 166), delegate { OpenForwardModal(tId); });
                        pnlForwardedList.Controls.Add(pItem);
                    }
                }
            }
            finally
            {
                pnlForwardedList.ResumeLayout();
            }
            tabRecv.Text = string.Format("Recv ({0})", count);
            tabRecv.BackColor = count > 0 ? Color.LightBlue : Color.White;
            ReflowPanel(pnlForwardedList, false);
            tabs.Invalidate();
        }

        private Panel CreateQueueItem(Dictionary<string, object> t, 
            string btn1Text, Color btn1Color, EventHandler onBtn1Click,
            string btn2Text = null, Color? btn2Color = null, EventHandler onBtn2Click = null)
        {
            Color bgColor = Color.WhiteSmoke;
            if (t.ContainsKey("status") && t["status"].ToString() == "received")
            {
                bgColor = Color.FromArgb(214, 234, 248);
            }
            else if (t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1)
            {
                bgColor = Color.FromArgb(250, 219, 216);
            }

            Panel p = new Panel() { Width = 235, Height = 34, BorderStyle = BorderStyle.FixedSingle, Margin = new Padding(1), BackColor = bgColor };
            
            string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : t["ticketnum"].ToString();
            string sName = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
            if (string.IsNullOrEmpty(sName) && t.ContainsKey("status")) sName = t["status"].ToString();

            string tTime = "";
            if (t.ContainsKey("start_time") && t["start_time"] != null && t["start_time"].ToString().Length > 0) tTime = t["start_time"].ToString();
            else if (t.ContainsKey("created_at") && t["created_at"] != null && t["created_at"].ToString().Length > 0)
            {
                DateTime dt;
                if (DateTime.TryParse(t["created_at"].ToString(), out dt)) tTime = dt.ToString("HH:mm:ss");
                else tTime = t["created_at"].ToString();
            }
            else if (t.ContainsKey("time") && t["time"] != null && t["time"].ToString().Length > 0) tTime = t["time"].ToString();
            
            string topText = !string.IsNullOrEmpty(tTime) ? string.Format("{0} ⌚{1}", tNum, tTime) : tNum;
            
            Label lblNum = new Label() { Text = topText, Font = new Font("Segoe UI", 8f, FontStyle.Bold), Location = new Point(2, 1), AutoSize = false, ForeColor = Color.FromArgb(40,40,40) };
            Label lblSvc = new Label() { Text = sName, Location = new Point(2, 16), AutoSize = false, Font = new Font("Segoe UI", 7f), ForeColor = Color.DimGray };

            if (!string.IsNullOrEmpty(btn2Text) && btn2Color.HasValue)
            {
                Button btn1 = CreateModernButton(btn1Text, 110, 3, 45, 26, btn1Color, Color.White);
                btn1.Font = new Font("Segoe UI", 6.5f, FontStyle.Bold);
                btn1.Click += onBtn1Click;
                
                Button btn2 = CreateModernButton(btn2Text, 160, 3, 45, 26, btn2Color.Value, Color.White);
                btn2.Font = new Font("Segoe UI", 6.5f, FontStyle.Bold);
                btn2.Click += onBtn2Click;
                
                appToolTip.SetToolTip(btn1, btn1Text.Replace("📢 ", "").Replace("▶ ", "").Replace("➡️ ", ""));
                appToolTip.SetToolTip(btn2, btn2Text.Replace("📢 ", "").Replace("▶ ", "").Replace("➡️ ", ""));

                p.Controls.Add(btn1);
                p.Controls.Add(btn2);
            }
            else
            {
                Button btn1 = CreateModernButton(btn1Text, 150, 3, 55, 26, btn1Color, Color.White);
                btn1.Font = new Font("Segoe UI", 7.5f, FontStyle.Bold);
                btn1.Click += onBtn1Click;
                appToolTip.SetToolTip(btn1, btn1Text.Replace("📢 ", "").Replace("▶ ", "").Replace("➡️ ", ""));
                p.Controls.Add(btn1);
            }

            p.Controls.Add(lblNum);
            p.Controls.Add(lblSvc);
            LayoutQueueCardControls(p, GetTargetCardWidth(pnlWaitingList));
            return p;
        }

        // --- ACTIONS ---

        private void CheckCurrentTicket()
        {
            if (ApiClient.CurrentTeller == null) return;
            if (Interlocked.CompareExchange(ref isCheckingTicket, 1, 0) != 0) return;

            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                try
                {
                    object[] tickets = ApiClient.GetArray("/api/tickets/called");
                    Dictionary<string, object> activeTicket = null;

                    if (tickets != null && ApiClient.CurrentTeller != null)
                    {
                        string myCounter = ApiClient.CurrentTeller["counter_number"].ToString();
                        foreach (Dictionary<string, object> t in tickets)
                        {
                            if (t.ContainsKey("counter_num") && t["counter_num"] != null && t["counter_num"].ToString() == myCounter)
                            {
                                string status = t.ContainsKey("status") && t["status"] != null ? t["status"].ToString() : "";
                                if (status != "held" && status != "received" && status != "voided" && status != "finished")
                                {
                                    activeTicket = t;
                                    break;
                                }
                            }
                        }
                    }

                    if (this.IsHandleCreated && !this.IsDisposed)
                    {
                        this.BeginInvoke(new Action(delegate
                        {
                            try
                            {
                                if (activeTicket != null)
                                {
                                    DisplayCurrentTicket(activeTicket);
                                }
                                else if (currentTicket != null)
                                {
                                    ClearCurrentTicket();
                                }
                            }
                            catch { }
                        }));
                    }
                }
                finally
                {
                    Interlocked.Exchange(ref isCheckingTicket, 0);
                }
            });
        }

        private void DisplayCurrentTicket(Dictionary<string, object> ticket)
        {
            currentTicket = ticket;
            string tNum = ticket.ContainsKey("ticketservice") ? string.Format("{0}{1}", ticket["ticketservice"], ticket["ticketnum"]) : ticket["ticketnum"].ToString();
            lblCurrentTicket.Text = tNum;
            lblCurrentTicket.ForeColor = Color.FromArgb(39, 174, 96);

            string sname = ticket.ContainsKey("shortSname") && ticket["shortSname"] != null && !string.IsNullOrEmpty(ticket["shortSname"].ToString())
                           ? ticket["shortSname"].ToString().Replace("_", " ") 
                           : (ticket.ContainsKey("sname") ? ticket["sname"].ToString().Replace("_", " ") : "");
            lblShortSname.Text = sname;

            if (ticket.ContainsKey("start_time") && ticket["start_time"] != null && ticket.ContainsKey("date") && ticket["date"] != null)
            {
                DateTime dt;
                if (DateTime.TryParse(string.Format("{0} {1}", ticket["date"], ticket["start_time"]), out dt))
                {
                    currentTicketStartTime = dt;
                    durationTimer.Start();
                }
            }
        }

        private void ClearCurrentTicket()
        {
            currentTicket = null;
            lblCurrentTicket.Text = "Ready";
            lblCurrentTicket.ForeColor = Color.FromArgb(41, 128, 185);
            lblShortSname.Text = "";
            durationTimer.Stop();
            lblDuration.Text = "00:00";
            currentTicketStartTime = null;
        }

        private void DurationTimer_Tick(object sender, EventArgs e)
        {
            if (currentTicketStartTime.HasValue)
            {
                TimeSpan diff = DateTime.Now - currentTicketStartTime.Value;
                if (diff.TotalSeconds < 0) diff = TimeSpan.Zero;
                lblDuration.Text = string.Format("⏳ {0:D2}:{1:D2}", (int)Math.Floor(diff.TotalMinutes), diff.Seconds);
            }
        }

        private void AutoCompleteActiveTicketSynchronous()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ApiClient.Post("/api/tickets/complete", reqData);
        }

        private void CallNext(string type, string service = null)
        {
            if (currentTicket != null && !AppSettings.AutoFinishEnabled)
            {
                MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            var reqData = new Dictionary<string, object>
            {
                { "tellerId", ApiClient.CurrentTeller["id"] },
                { "counterNumber", ApiClient.CurrentTeller["counter_number"] },
                { "counter_group", ApiClient.CurrentTeller.ContainsKey("group_name") ? ApiClient.CurrentTeller["group_name"] : "" },
                { "counter_user", ApiClient.CurrentTeller["username"] }
            };

            if (type == "auto")
            {
                reqData.Add("mode", "auto");
                reqData.Add("mix_received", AppSettings.ShowReceivedInWaiting);
                ExecuteCall(reqData);
            }
            else
            {
                if (string.IsNullOrEmpty(service))
                {
                    MessageBox.Show("Please select a service first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                ThreadPool.QueueUserWorkItem(delegate(object state)
                {
                    var p = new Dictionary<string, string> { { "services", service } };
                    object[] wTickets = ApiClient.GetArray("/api/tickets/waiting", p);
                    if (wTickets != null)
                    {
                        int priorityTarget = type == "priority" ? 1 : 0;
                        string targetId = null;
                        foreach (Dictionary<string, object> t in wTickets)
                        {
                            if (t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == priorityTarget)
                            {
                                targetId = t["id"].ToString();
                                break;
                            }
                        }

                        if (targetId != null)
                        {
                            this.BeginInvoke(new Action(delegate { CallSpecificTicket(targetId); }));
                        }
                        else
                        {
                            this.BeginInvoke(new Action(delegate { MessageBox.Show(string.Format("No {0} tickets for {1}", type, service), "Info", MessageBoxButtons.OK, MessageBoxIcon.Information); }));
                        }
                    }
                });
            }
        }

        private void CallSpecificTicket(string ticketId)
        {
            if (currentTicket != null && currentTicket["id"].ToString() == ticketId) return;

            if (currentTicket != null && !AppSettings.AutoFinishEnabled)
            {
                MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            var reqData = new Dictionary<string, object>
            {
                { "ticketId", ticketId },
                { "tellerId", ApiClient.CurrentTeller["id"] },
                { "counterNumber", ApiClient.CurrentTeller["counter_number"] },
                { "counter_group", ApiClient.CurrentTeller.ContainsKey("group_name") ? ApiClient.CurrentTeller["group_name"] : "" },
                { "counter_user", ApiClient.CurrentTeller["username"] }
            };
            ExecuteCall(reqData);
        }

        private void ExecuteCall(object reqData)
        {
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                if (AppSettings.AutoFinishEnabled && currentTicket != null)
                {
                    AutoCompleteActiveTicketSynchronous();
                    this.BeginInvoke(new Action(delegate { ClearCurrentTicket(); }));
                }

                var response = ApiClient.Post("/api/tickets/call", reqData);
                this.BeginInvoke(new Action(delegate
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        DisplayCurrentTicket((Dictionary<string, object>)response["ticket"]);
                        ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                    }
                    else
                    {
                        string msg = response != null && response.ContainsKey("message") ? response["message"].ToString() : "No tickets available";
                        MessageBox.Show(msg, "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                }));
            });
        }

        private void RecallTicket()
        {
            if (currentTicket == null) return;
            PlayCustomSound("ring");
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ThreadPool.QueueUserWorkItem(delegate(object state) { ApiClient.Post("/api/tickets/recall", reqData); });
        }

        private void CompleteTicket()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                ApiClient.Post("/api/tickets/complete", reqData);
                this.BeginInvoke(new Action(delegate
                {
                    ClearCurrentTicket();
                    ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                }));
            });
        }

        private void HoldTicket()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                ApiClient.Post("/api/tickets/hold", reqData);
                this.BeginInvoke(new Action(delegate
                {
                    PlayCustomSound("held");
                    ClearCurrentTicket();
                    ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                }));
            });
        }

        private void ResumeHeldTicket(string ticketId)
        {
            if (currentTicket != null && !AppSettings.AutoFinishEnabled)
            {
                MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            var reqData = new Dictionary<string, object>
            {
                { "ticketId", ticketId },
                { "tellerId", ApiClient.CurrentTeller["id"] },
                { "counterNumber", ApiClient.CurrentTeller["counter_number"] },
                { "counter_group", ApiClient.CurrentTeller.ContainsKey("group_name") ? ApiClient.CurrentTeller["group_name"] : "" },
                { "counter_user", ApiClient.CurrentTeller["username"] }
            };

            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                if (AppSettings.AutoFinishEnabled && currentTicket != null)
                {
                    AutoCompleteActiveTicketSynchronous();
                    this.BeginInvoke(new Action(delegate { ClearCurrentTicket(); }));
                }

                var response = ApiClient.Post("/api/tickets/resume", reqData);
                this.BeginInvoke(new Action(delegate
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        DisplayCurrentTicket((Dictionary<string, object>)response["ticket"]);
                        ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                    }
                }));
            });
        }

        private void OpenForwardModal(string specificTicketId = null)
        {
            string targetTicketId = specificTicketId != null ? specificTicketId : (currentTicket != null ? currentTicket["id"].ToString() : null);
            if (targetTicketId == null) return;
            
            object[] tellers = ApiClient.GetArray("/api/tellers/list", new Dictionary<string, string> { { "id", ApiClient.CurrentTeller["id"].ToString() }, { "activeToday", "true" } });
            object[] groups = ApiClient.GetArray("/api/groups/list");

            if (groups == null || groups.Length == 0)
            {
                var uniqueGroups = new Dictionary<string, Dictionary<string, object>>();
                if (tellers != null)
                {
                    foreach (Dictionary<string, object> t in tellers)
                    {
                        if (t.ContainsKey("group_id") && t["group_id"] != null && !string.IsNullOrEmpty(t["group_id"].ToString()) &&
                            t.ContainsKey("group_name") && t["group_name"] != null && !string.IsNullOrEmpty(t["group_name"].ToString()))
                        {
                            string gId = t["group_id"].ToString();
                            if (!uniqueGroups.ContainsKey(gId))
                            {
                                var g = new Dictionary<string, object>();
                                g["id"] = gId;
                                g["group_name"] = t["group_name"];
                                uniqueGroups[gId] = g;
                            }
                        }
                    }
                }
                groups = new List<Dictionary<string, object>>(uniqueGroups.Values).ToArray();
            }

            using (ForwardModal fm = new ForwardModal(tellers, groups))
            {
                if (fm.ShowDialog() == DialogResult.OK)
                {
                    var reqData = new Dictionary<string, object>
                    {
                        { "ticketId", targetTicketId },
                        { "fromTellerId", ApiClient.CurrentTeller["id"] },
                        { "toTellerId", fm.SelectedTargetType == "teller" ? fm.SelectedTellerId : null },
                        { "toGroupId", fm.SelectedTargetType == "group" ? fm.SelectedGroupId : null },
                        { "note", fm.Note },
                        { "cname", ApiClient.CurrentTeller["username"] },
                        { "cnum", ApiClient.CurrentTeller["counter_number"] }
                    };

                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        var response = ApiClient.Post("/api/tickets/forward", reqData);
                        this.BeginInvoke(new Action(delegate
                        {
                            bool isSuccess = response != null && response.ContainsKey("success") && (bool)response["success"];
                            if (isSuccess && currentTicket != null && currentTicket["id"].ToString() == targetTicketId)
                            {
                                ClearCurrentTicket();
                            }
                            ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                            ShowToastPopup(isSuccess ? "Ticket forwarded successfully." : "Failed to forward ticket.", isSuccess);
                        }));
                    });
                }
            }
        }

        private void ShowToastPopup(string message, bool isSuccess)
        {
            Form toast = new Form();
            toast.FormBorderStyle = FormBorderStyle.None;
            toast.StartPosition = FormStartPosition.CenterScreen;
            toast.Size = new Size(260, 56);
            toast.BackColor = isSuccess ? Color.FromArgb(46, 204, 113) : Color.FromArgb(231, 76, 60);
            toast.TopMost = true;
            toast.ShowInTaskbar = false;

            Label lbl = new Label();
            lbl.Text = message;
            lbl.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            lbl.ForeColor = Color.White;
            lbl.AutoSize = false;
            lbl.Dock = DockStyle.Fill;
            lbl.TextAlign = ContentAlignment.MiddleCenter;
            toast.Controls.Add(lbl);

            PlayCustomSound(isSuccess ? "success" : "alarm");

            System.Windows.Forms.Timer t = new System.Windows.Forms.Timer();
            t.Interval = 2500;
            t.Tick += delegate { t.Stop(); t.Dispose(); toast.Close(); toast.Dispose(); };
            toast.Load += delegate { t.Start(); };
            toast.Show();
        }

        private void OpenVoidModal()
        {
            if (currentTicket == null) return;
            
            using (VoidModal vm = new VoidModal())
            {
                if (vm.ShowDialog() == DialogResult.OK)
                {
                    var reqData = new Dictionary<string, object>
                    {
                        { "ticketId", currentTicket["id"] },
                        { "reason", vm.Reason },
                        { "notes", vm.Notes },
                        { "cname", ApiClient.CurrentTeller["username"] },
                        { "cnum", ApiClient.CurrentTeller["counter_number"] }
                    };

                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        ApiClient.Post("/api/tickets/void", reqData);
                        this.BeginInvoke(new Action(delegate
                        {
                            PlayCustomSound("void");
                            ClearCurrentTicket();
                            ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                        }));
                    });
                }
            }
        }

        private void PlayCustomSound(string soundType)
        {
            if (!AppSettings.EnableSoundAlerts) return;

            ThreadPool.QueueUserWorkItem(delegate (object state)
            {
                try
                {
                    if (soundType == "alarm" || soundType == "ring")
                    {
                        string windir = Environment.GetEnvironmentVariable("WINDIR") ?? @"C:\Windows";
                        string wavPath = soundType == "alarm"
                            ? System.IO.Path.Combine(windir, "Media", "Alarm01.wav")
                            : System.IO.Path.Combine(windir, "Media", "Ring01.wav");
                        if (System.IO.File.Exists(wavPath))
                        {
                            using (var player = new System.Media.SoundPlayer(wavPath))
                            {
                                player.PlaySync();
                            }
                        }
                        else
                        {
                            System.Media.SystemSounds.Beep.Play();
                        }
                    }
                    else
                    {
                        System.IO.Stream audioStream = null;
                        if (soundType == "success") audioStream = Properties.Resources._success;
                        else if (soundType == "held") audioStream = Properties.Resources._held;
                        else if (soundType == "received") audioStream = Properties.Resources._received;
                        else if (soundType == "void") audioStream = Properties.Resources._void;

                        if (audioStream != null)
                        {
                            using (var player = new System.Media.SoundPlayer(audioStream))
                            {
                                player.PlaySync();
                            }
                        }
                    }
                }
                catch { }
            });
        }
    }
}
