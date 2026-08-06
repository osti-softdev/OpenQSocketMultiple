using System;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;
using System.Collections.Generic;

namespace CallerApp
{
    public static class AppSettings
    {
        private static bool _autoFinishEnabled = false;
        private static bool _showReceivedInWaiting = false;
        private static bool _showTooltips = true;
        private static bool _alwaysOnTop = false;
        private static string _savedUsername = "";
        private static string _savedPassword = "";

        public static bool AutoFinishEnabled { get { return _autoFinishEnabled; } set { _autoFinishEnabled = value; } }
        public static bool ShowReceivedInWaiting { get { return _showReceivedInWaiting; } set { _showReceivedInWaiting = value; } }
        public static bool ShowTooltips { get { return _showTooltips; } set { _showTooltips = value; } }
        public static bool AlwaysOnTop { get { return _alwaysOnTop; } set { _alwaysOnTop = value; } }
        public static string SavedUsername { get { return _savedUsername; } set { _savedUsername = value; } }
        public static string SavedPassword { get { return _savedPassword; } set { _savedPassword = value; } }

        private static string GetConfigPath()
        {
            string folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "OpenQCallerApp");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }
            return Path.Combine(folder, "config.json");
        }

        public static void Load()
        {
            try {
                string path = GetConfigPath();
                if (File.Exists(path)) {
                    string json = File.ReadAllText(path);
                    var data = new System.Web.Script.Serialization.JavaScriptSerializer().Deserialize<Dictionary<string, object>>(json);
                    if (data.ContainsKey("BaseUrl")) ApiClient.BaseUrl = data["BaseUrl"].ToString();
                    if (data.ContainsKey("AutoFinishEnabled")) _autoFinishEnabled = (bool)data["AutoFinishEnabled"];
                    if (data.ContainsKey("ShowReceivedInWaiting")) _showReceivedInWaiting = (bool)data["ShowReceivedInWaiting"];
                    if (data.ContainsKey("ShowTooltips")) _showTooltips = (bool)data["ShowTooltips"];
                    if (data.ContainsKey("AlwaysOnTop")) _alwaysOnTop = (bool)data["AlwaysOnTop"];
                    if (data.ContainsKey("SavedUsername")) _savedUsername = data["SavedUsername"].ToString();
                    if (data.ContainsKey("SavedPassword")) _savedPassword = data["SavedPassword"].ToString();
                }
            } catch {}
        }

        public static void Save()
        {
            try {
                var data = new Dictionary<string, object> {
                    { "BaseUrl", ApiClient.BaseUrl },
                    { "AutoFinishEnabled", _autoFinishEnabled },
                    { "ShowReceivedInWaiting", _showReceivedInWaiting },
                    { "ShowTooltips", _showTooltips },
                    { "AlwaysOnTop", _alwaysOnTop },
                    { "SavedUsername", _savedUsername },
                    { "SavedPassword", _savedPassword }
                };
                string json = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(data);
                File.WriteAllText(GetConfigPath(), json);
            } catch {}
        }
    }

    public static class ApiClient
    {
        private static string _baseUrl = "http://localhost:12341";
        public static string BaseUrl { get { return _baseUrl; } set { _baseUrl = value; } }
        private static CookieContainer cookieContainer = new CookieContainer();
        private static JavaScriptSerializer serializer = new JavaScriptSerializer();

        // Data Models to store current Teller info
        public static Dictionary<string, object> CurrentTeller { get; set; }


        public static Dictionary<string, object> Post(string endpoint, object data)
        {
            var json = serializer.Serialize(data);
            return SendRequest("POST", endpoint, json);
        }

        public static Dictionary<string, object> Get(string endpoint, Dictionary<string, string> queryParams = null)
        {
            if (queryParams != null && queryParams.Count > 0)
            {
                var queryList = new List<string>();
                foreach (var kvp in queryParams)
                {
                    queryList.Add(Uri.EscapeDataString(kvp.Key) + "=" + Uri.EscapeDataString(kvp.Value));
                }
                endpoint += "?" + string.Join("&", queryList.ToArray());
            }

            return SendRequest("GET", endpoint, null);
        }

        public static T Get<T>(string endpoint, Dictionary<string, string> queryParams = null)
        {
            if (queryParams != null && queryParams.Count > 0)
            {
                var queryList = new List<string>();
                foreach (var kvp in queryParams)
                {
                    queryList.Add(Uri.EscapeDataString(kvp.Key) + "=" + Uri.EscapeDataString(kvp.Value));
                }
                endpoint += "?" + string.Join("&", queryList.ToArray());
            }

            string responseJson = SendRequestRaw("GET", endpoint, null);
            return serializer.Deserialize<T>(responseJson);
        }

        public static object[] GetArray(string endpoint, Dictionary<string, string> queryParams = null)
        {
            if (queryParams != null && queryParams.Count > 0)
            {
                var queryList = new List<string>();
                foreach (var kvp in queryParams)
                {
                    queryList.Add(Uri.EscapeDataString(kvp.Key) + "=" + Uri.EscapeDataString(kvp.Value));
                }
                endpoint += "?" + string.Join("&", queryList.ToArray());
            }

            string responseJson = SendRequestRaw("GET", endpoint, null);
            if (string.IsNullOrEmpty(responseJson)) return new object[0];

            object parsed = serializer.Deserialize<object>(responseJson);
            
            if (parsed is object[])
            {
                return (object[])parsed;
            }
            if (parsed is System.Collections.ArrayList)
            {
                return ((System.Collections.ArrayList)parsed).ToArray();
            }
            return new object[0];
        }

        private static Dictionary<string, object> SendRequest(string method, string endpoint, string jsonBody)
        {
            string responseText = SendRequestRaw(method, endpoint, jsonBody);
            if (string.IsNullOrEmpty(responseText))
                return new Dictionary<string, object>();

            return serializer.Deserialize<Dictionary<string, object>>(responseText);
        }

        private static string SendRequestRaw(string method, string endpoint, string jsonBody)
        {
            try
            {
                var request = (HttpWebRequest)WebRequest.Create(BaseUrl + endpoint);
                request.Method = method;
                request.CookieContainer = cookieContainer;

                if (method == "POST" || method == "PUT")
                {
                    request.ContentType = "application/json";
                    if (!string.IsNullOrEmpty(jsonBody))
                    {
                        byte[] data = Encoding.UTF8.GetBytes(jsonBody);
                        request.ContentLength = data.Length;
                        using (var stream = request.GetRequestStream())
                        {
                            stream.Write(data, 0, data.Length);
                        }
                    }
                }

                using (var response = (HttpWebResponse)request.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream()))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (WebException ex)
            {
                if (ex.Response != null)
                {
                    using (var reader = new StreamReader(ex.Response.GetResponseStream()))
                    {
                        return reader.ReadToEnd();
                    }
                }
                return "{\"success\":false,\"message\":\"" + ex.Message.Replace("\"", "\\\"") + "\"}";
            }
            catch (Exception ex)
            {
                return "{\"success\":false,\"message\":\"" + ex.Message.Replace("\"", "\\\"") + "\"}";
            }
        }
    }
}
