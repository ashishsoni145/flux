using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace FluxIDE.Setup
{
    public class SetupForm : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Label titleLabel;
        private Label infoLabel;
        private Button installButton;
        private CheckBox desktopShortcutCheck;
        private CheckBox launchCheck;
        private TextBox pathTextBox;

        public SetupForm()
        {
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "FluxIDE Setup — AI Software Engineering Platform";
            this.Size = new Size(560, 420);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(16, 20, 32);
            this.ForeColor = Color.White;

            titleLabel = new Label
            {
                Text = "⚡ Install FluxIDE Desktop",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 229, 255),
                Location = new Point(24, 20),
                Size = new Size(500, 36)
            };

            infoLabel = new Label
            {
                Text = "AI-Native Software Engineering Platform (v0.1.0)\nPowered by Monaco Editor, 16 Autonomous Personas, and Living Knowledge Graph.",
                Font = new Font("Segoe UI", 9),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(24, 60),
                Size = new Size(500, 40)
            };

            Label destLabel = new Label
            {
                Text = "Destination Folder:",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                Location = new Point(24, 115),
                Size = new Size(500, 20)
            };

            string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "FluxIDE");

            pathTextBox = new TextBox
            {
                Text = defaultPath,
                Font = new Font("Segoe UI", 9),
                Location = new Point(24, 140),
                Size = new Size(495, 24),
                BackColor = Color.FromArgb(24, 30, 48),
                ForeColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };

            desktopShortcutCheck = new CheckBox
            {
                Text = "Create Desktop Shortcut",
                Checked = true,
                Font = new Font("Segoe UI", 9),
                Location = new Point(24, 180),
                Size = new Size(300, 24),
                ForeColor = Color.White
            };

            launchCheck = new CheckBox
            {
                Text = "Launch FluxIDE when installation completes",
                Checked = true,
                Font = new Font("Segoe UI", 9),
                Location = new Point(24, 210),
                Size = new Size(350, 24),
                ForeColor = Color.White
            };

            progressBar = new ProgressBar
            {
                Location = new Point(24, 260),
                Size = new Size(495, 20),
                Minimum = 0,
                Maximum = 100,
                Value = 0,
                Visible = false
            };

            statusLabel = new Label
            {
                Text = "Ready to install.",
                Font = new Font("Segoe UI", 8.5f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(24, 285),
                Size = new Size(495, 24),
                Visible = false
            };

            installButton = new Button
            {
                Text = "Install FluxIDE",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 229, 255),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(360, 320),
                Size = new Size(160, 38),
                Cursor = Cursors.Hand
            };
            installButton.FlatAppearance.BorderSize = 0;
            installButton.Click += (s, e) => StartInstall();

            this.Controls.Add(titleLabel);
            this.Controls.Add(infoLabel);
            this.Controls.Add(destLabel);
            this.Controls.Add(pathTextBox);
            this.Controls.Add(desktopShortcutCheck);
            this.Controls.Add(launchCheck);
            this.Controls.Add(progressBar);
            this.Controls.Add(statusLabel);
            this.Controls.Add(installButton);
        }

        private void StartInstall()
        {
            installButton.Enabled = false;
            progressBar.Visible = true;
            statusLabel.Visible = true;

            string targetDir = pathTextBox.Text.Trim();
            bool makeDesktop = desktopShortcutCheck.Checked;
            bool launchAfter = launchCheck.Checked;

            Thread worker = new Thread(() =>
            {
                try
                {
                    UpdateStatus("Preparing destination directory...", 15);
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    UpdateStatus("Copying FluxIDE binaries and platform packages...", 40);
                    string sourceDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                    
                    // If running from installer package, copy package files
                    string appSource = @"E:\FluxIDE\fluxIDE APP";
                    if (!Directory.Exists(appSource))
                    {
                        appSource = sourceDir;
                    }

                    CopyDirectory(Path.Combine(appSource, "packages"), Path.Combine(targetDir, "packages"));
                    
                    // Copy launcher and scripts
                    File.Copy(Path.Combine(appSource, "FluxIDE-Desktop.bat"), Path.Combine(targetDir, "FluxIDE-Desktop.bat"), true);
                    if (File.Exists(Path.Combine(appSource, "FluxIDE.exe")))
                    {
                        File.Copy(Path.Combine(appSource, "FluxIDE.exe"), Path.Combine(targetDir, "FluxIDE.exe"), true);
                    }

                    UpdateStatus("Registering Windows Start Menu and Desktop shortcuts...", 75);

                    // Start Menu
                    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs\FluxIDE");
                    if (!Directory.Exists(startMenu)) Directory.CreateDirectory(startMenu);
                    
                    string exeTarget = File.Exists(Path.Combine(targetDir, "FluxIDE.exe")) 
                        ? Path.Combine(targetDir, "FluxIDE.exe") 
                        : Path.Combine(targetDir, "FluxIDE-Desktop.bat");

                    CreateShortcut(Path.Combine(startMenu, "FluxIDE.lnk"), exeTarget, targetDir, "FluxIDE AI Software Engineering IDE");

                    // Desktop Shortcut
                    if (makeDesktop)
                    {
                        string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                        CreateShortcut(Path.Combine(desktopPath, "FluxIDE.lnk"), exeTarget, targetDir, "FluxIDE AI Software Engineering IDE");
                    }

                    // Windows Registry Entry for Add/Remove Programs
                    UpdateStatus("Registering application metadata in Windows...", 90);
                    RegisterUninstall(targetDir);

                    UpdateStatus("Installation complete!", 100);

                    this.Invoke(new Action(() =>
                    {
                        MessageBox.Show(this, "FluxIDE has been successfully installed on your computer!\n\nYou can launch it anytime from your Start Menu.", "FluxIDE Installation Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        
                        if (launchAfter)
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = exeTarget,
                                WorkingDirectory = targetDir,
                                UseShellExecute = true
                            });
                        }

                        this.Close();
                    }));
                }
                catch (Exception ex)
                {
                    this.Invoke(new Action(() =>
                    {
                        MessageBox.Show(this, "Installation error: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        installButton.Enabled = true;
                    }));
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        private void UpdateStatus(string msg, int progress)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => UpdateStatus(msg, progress)));
                return;
            }
            statusLabel.Text = msg;
            progressBar.Value = progress;
        }

        public static void CopyDirectory(string sourceDir, string destinationDir)
        {
            if (!Directory.Exists(sourceDir)) return;
            Directory.CreateDirectory(destinationDir);

            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string destFile = Path.Combine(destinationDir, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }

            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string dirName = Path.GetFileName(subDir);
                if (dirName == ".git") continue;
                string destSubDir = Path.Combine(destinationDir, dirName);
                CopyDirectory(subDir, destSubDir);
            }
        }

        public static void CreateShortcut(string shortcutPath, string targetPath, string workDir, string desc)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            dynamic shell = Activator.CreateInstance(shellType);
            dynamic shortcut = shell.CreateShortcut(shortcutPath);
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = workDir;
            shortcut.Description = desc;
            shortcut.Save();
        }

        public static void RegisterUninstall(string installDir)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\FluxIDE"))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "FluxIDE (AI Software Engineering IDE)");
                        key.SetValue("DisplayVersion", "0.1.0");
                        key.SetValue("Publisher", "FluxIDE Team");
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("UninstallString", Path.Combine(installDir, "FluxIDE-Desktop.bat") + " --uninstall");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }
        }

        public static void PerformUninstall()
        {
            try
            {
                string targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "FluxIDE");
                
                // 1. Remove Start Menu Shortcut
                string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs\FluxIDE");
                if (Directory.Exists(startMenu)) Directory.Delete(startMenu, true);

                // 2. Remove Desktop Shortcut
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string deskShortcut = Path.Combine(desktopPath, "FluxIDE.lnk");
                if (File.Exists(deskShortcut)) File.Delete(deskShortcut);

                // 3. Remove Registry Entry
                try
                {
                    Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\FluxIDE", false);
                }
                catch { }

                // 4. Remove Install Directory
                if (Directory.Exists(targetDir))
                {
                    Directory.Delete(targetDir, true);
                }

                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer-log.txt"), "Uninstall completed successfully at " + DateTime.Now);
            }
            catch (Exception ex)
            {
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer-log.txt"), "Uninstall error: " + ex.ToString());
            }
        }

        public static void PerformSilentInstall()
        {
            try
            {
                string targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "FluxIDE");
                if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);

                string appSource = @"E:\FluxIDE\fluxIDE APP";
                CopyDirectory(Path.Combine(appSource, "packages"), Path.Combine(targetDir, "packages"));
                
                File.Copy(Path.Combine(appSource, "FluxIDE-Desktop.bat"), Path.Combine(targetDir, "FluxIDE-Desktop.bat"), true);
                if (File.Exists(Path.Combine(appSource, "FluxIDE.exe")))
                {
                    File.Copy(Path.Combine(appSource, "FluxIDE.exe"), Path.Combine(targetDir, "FluxIDE.exe"), true);
                }

                string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs\FluxIDE");
                if (!Directory.Exists(startMenu)) Directory.CreateDirectory(startMenu);
                string exeTarget = Path.Combine(targetDir, "FluxIDE.exe");
                CreateShortcut(Path.Combine(startMenu, "FluxIDE.lnk"), exeTarget, targetDir, "FluxIDE AI Software Engineering IDE");

                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                CreateShortcut(Path.Combine(desktopPath, "FluxIDE.lnk"), exeTarget, targetDir, "FluxIDE AI Software Engineering IDE");

                RegisterUninstall(targetDir);
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer-log.txt"), "Install completed successfully to " + targetDir + " at " + DateTime.Now);
            }
            catch (Exception ex)
            {
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer-log.txt"), "Install error: " + ex.ToString());
            }
        }

        [STAThread]
        public static void Main(string[] args)
        {
            if (args != null && args.Length > 0)
            {
                string arg = args[0].ToLowerInvariant();
                if (arg == "/uninstall" || arg == "--uninstall" || arg == "-u")
                {
                    PerformUninstall();
                    return;
                }
                if (arg == "/silent" || arg == "/s" || arg == "--silent")
                {
                    PerformSilentInstall();
                    return;
                }
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
