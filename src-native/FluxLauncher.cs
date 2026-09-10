using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace FluxIDE
{
    static class FluxLauncher
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                string nodeExe = Path.Combine(appDir, "bin", "node.exe");
                if (!File.Exists(nodeExe))
                {
                    // Fall back to portable tools or PATH
                    string usbNode = @"E:\FluxIDE\tools\nodejs\node.exe";
                    if (File.Exists(usbNode)) nodeExe = usbNode;
                    else nodeExe = "node";
                }

                int port = 48100;
                string healthUrl = string.Format("http://127.0.0.1:{0}/health", port);
                string desktopUrl = string.Format("http://127.0.0.1:{0}/desktop", port);

                // 1. Check if daemon is already alive
                bool isAlive = CheckHealth(healthUrl);
                if (!isAlive)
                {
                    // Launch daemon in background with hidden window
                    string engineScript = Path.Combine(appDir, "packages", "engine", "dist", "index.js");
                    if (!File.Exists(engineScript))
                    {
                        engineScript = @"packages\engine\dist\index.js";
                    }

                    ProcessStartInfo psiDaemon = new ProcessStartInfo
                    {
                        FileName = nodeExe,
                        Arguments = string.Format("\"{0}\"", engineScript),
                        WorkingDirectory = appDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };

                    // Inherit PATH and set NODE_PATH
                    string toolsDir = @"E:\FluxIDE\tools";
                    string appRoot = @"E:\FluxIDE\fluxIDE APP";
                    if (Directory.Exists(toolsDir))
                    {
                        string currentPath = Environment.GetEnvironmentVariable("PATH") ?? "";
                        psiDaemon.EnvironmentVariables["PATH"] = Path.Combine(toolsDir, "nodejs") + ";" +
                                                              Path.Combine(toolsDir, "node_modules", ".bin") + ";" +
                                                              Path.Combine(toolsDir, "git", "cmd") + ";" +
                                                              currentPath;
                        psiDaemon.EnvironmentVariables["NODE_PATH"] = Path.Combine(toolsDir, "node_modules") + ";" +
                                                                    Path.Combine(appRoot, "node_modules");
                    }

                    Process.Start(psiDaemon);

                    // Wait up to 5 seconds for health
                    for (int i = 0; i < 20; i++)
                    {
                        Thread.Sleep(250);
                        if (CheckHealth(healthUrl)) break;
                    }
                }

                // 2. Launch Native IDE App Window via Edge App Mode
                string edgeExe = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                if (!File.Exists(edgeExe))
                {
                    edgeExe = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                }

                string profileDir = Path.Combine(appDir, ".desktop-profile");

                if (File.Exists(edgeExe))
                {
                    ProcessStartInfo psiEdge = new ProcessStartInfo
                    {
                        FileName = edgeExe,
                        Arguments = string.Format("--app=\"{0}\" --window-size=1440,900 --user-data-dir=\"{1}\"", desktopUrl, profileDir),
                        UseShellExecute = true
                    };
                    Process.Start(psiEdge);
                }
                else
                {
                    Process.Start(new ProcessStartInfo(desktopUrl) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch FluxIDE: " + ex.Message, "FluxIDE Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static bool CheckHealth(string url)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 1000;
                req.Method = "GET";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
