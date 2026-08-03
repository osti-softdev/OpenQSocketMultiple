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

        public static bool AutoFinishEnabled { get { return _autoFinishEnabled; } set { _autoFinishEnabled = value; } }
        public static bool ShowReceivedInWaiting { get { return _showReceivedInWaiting; } set { _showReceivedInWaiting = value; } }
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
