import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Shield, Zap, Users, ArrowRight, CheckCircle, Star, Globe, Clock, QrCode, Smartphone, Send, Download, UserPlus, UserCheck, ArrowDown } from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'End-to-end encryption ensures your files are safe and private during transfer.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Advanced compression and chunked uploads for blazing fast file transfers.'
    },
    {
      icon: Clock,
      title: 'Auto Expiry',
      description: 'Files automatically expire after 7 days to protect your privacy.'
    },
    {
      icon: Globe,
      title: 'No Sender Registration',
      description: 'Send files instantly without creating an account. Only recipients need to register.'
    }
  ];

  const stats = [
    { number: '10M+', label: 'Files Shared' },
    { number: '500K+', label: 'Happy Users' },
    { number: '99.9%', label: 'Uptime' },
    { number: '256-bit', label: 'Encryption' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-teal-500 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-emerald-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-cyan-500 rounded-full blur-xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 mb-8">
              <Star className="w-4 h-4 mr-2" />
              No registration required for senders
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Share Files
              <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Instantly & Securely
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Send files to anyone in seconds. Scan QR codes or use recipient IDs. 
              No account needed to send - recipients get files automatically in their dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/upload"
                className="group flex items-center space-x-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Send className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Send Files Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/register"
                className="flex items-center space-x-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 transition-all duration-300 hover:shadow-lg"
              >
                <UserPlus className="w-6 h-6" />
                <span>Register to Receive</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Two Simple Ways to Share
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the method that works best for you. Both are instant and secure.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Method 1: QR Code */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border border-teal-200 dark:border-teal-800">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Method 1: Scan QR Code
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The easiest way - just scan and send
                </p>
              </div>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <UserCheck className="w-5 h-5 text-teal-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Recipient shares QR code</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Registered users can generate and share their personal QR code
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Smartphone className="w-5 h-5 text-teal-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Scan with your phone</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use any QR scanner or camera app to scan the code
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Upload className="w-5 h-5 text-teal-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Enter name & upload files</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No account needed - just enter your name and select files to send
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Send className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Files delivered instantly</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recipient gets files automatically in their dashboard
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-teal-200 dark:border-teal-700">
                <div className="flex items-center space-x-2 text-sm text-teal-700 dark:text-teal-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Perfect for: Quick sharing, mobile users, one-time sends</span>
                </div>
              </div>
            </div>

            {/* Method 2: Recipient ID */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border border-blue-200 dark:border-blue-800">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Method 2: Recipient ID
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Direct sharing with unique ID
                </p>
              </div>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Get recipient's unique ID</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Every registered user has a unique short code (e.g., "ABC123")
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Visit upload page</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Go to our upload page from any device or browser
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Enter ID, name & files</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Type the recipient ID, your name, and select files to send
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Send className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Files delivered instantly</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recipient gets files automatically in their dashboard
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Perfect for: Desktop users, repeat sharing, business use</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Points */}
          <div className="mt-16 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Important to Know
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">For Senders</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No registration required. Just enter your name and send files instantly.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">For Recipients</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Registration required to receive files and access your personal dashboard.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">File Delivery</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recipients get files automatically. Senders don't get download links.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose EasySharer?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built with security, speed, and simplicity in mind. Everything you need for modern file sharing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-600 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600" id="get-started">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Share Files Instantly?
          </h2>
          <p className="text-xl text-teal-100 mb-12 max-w-2xl mx-auto">
            Join thousands of users who trust EasySharer for their file sharing needs. 
            Start sharing securely today - no registration required to send!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/upload"
              className="group flex items-center space-x-3 bg-white text-teal-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Send className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Send Files Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/register"
              className="flex items-center space-x-3 bg-transparent text-white px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300"
            >
              <UserPlus className="w-6 h-6" />
              <span>Register to Receive Files</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;