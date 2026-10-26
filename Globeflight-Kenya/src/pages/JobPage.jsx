import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";

import { API_BASE } from "@/constants/api";

console.log('JobPage API_BASE:', API_BASE);

function JobPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching jobs from:', `${API_BASE}/jobs/public`);
      const res = await axios.get(`${API_BASE}/jobs/public`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      console.log('Jobs response:', res.data);
      
      if (res.data.success && res.data.data && res.data.data.jobs) {
        const now = new Date();
        const openJobs = res.data.data.jobs.filter(
          (job) =>
            !job.isClosed &&
            (!job.applicationDeadline || new Date(job.applicationDeadline) >= now)
        );
        setJobs(openJobs);
      } else {
        setJobs([]);
        setError('No jobs data received');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again later.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Careers at Globeflight Kenya | Join Our Team</title>
        <meta name="description" content="Explore exciting career opportunities at Globeflight Kenya. Join our team and grow your career in logistics and express delivery." />
        <meta property="og:title" content="Careers at Globeflight Kenya | Join Our Team" />
        <meta property="og:description" content="Explore exciting career opportunities at Globeflight Kenya. Join our team and grow your career in logistics and express delivery." />
        <meta property="og:url" content="https://globeflight.co.ke/jobs" />
        <link rel="canonical" href="https://globeflight.co.ke/jobs" />
      </Helmet>
      
      <div className="min-h-screen mt-16 bg-gray-50">
        {/* Hero Section - Edge to Edge */}
        <section className="relative w-screen min-h-[70vh] overflow-hidden bg-gradient-to-br from-[#88C300] to-[#6ea000]" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>

          {/* Content - Full Width */}
          <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="max-w-7xl mx-auto">
              <div className="grid items-center gap-12 lg:grid-cols-2">
                <div className="space-y-6 text-white">
                  <h1 className="text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
                    Join Our Team at Globeflight
                  </h1>
                  
                  <p className="max-w-2xl text-xl leading-relaxed md:text-2xl text-white/95">
                    Discover exciting career opportunities and grow with a global leader
                    in logistics and express delivery.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                    <a
                      href="#open-positions"
                      className="inline-flex items-center px-8 py-4 font-semibold text-[#88C300] bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('open-positions')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      View Open Positions
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </a>
                    <div className="flex items-center space-x-2 text-white/90">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{loading ? '...' : jobs.length} Open Positions</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative hidden lg:block">
                  <img
                    src="/job.avif"
                    alt="Professional career opportunities"
                    className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section id="open-positions" className="container max-w-7xl px-4 py-16 mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Open Positions
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Find your perfect role and start your journey with Globeflight
            </p>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#88C300] rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="mt-6 text-lg text-gray-600">Loading opportunities...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center bg-white shadow-sm rounded-2xl">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xl text-gray-600">{error}</p>
              <button 
                onClick={fetchJobs}
                className="mt-4 px-6 py-2 bg-[#88C300] text-white rounded-lg hover:bg-[#6ea000] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center bg-white shadow-sm rounded-2xl">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-xl text-gray-600">No open positions at the moment.</p>
              <p className="mt-2 text-gray-500">Please check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Link
                  to={`/jobs/${job.slug}`}
                  key={job.id}
                  className="relative overflow-hidden transition-all duration-300 bg-white shadow-lg group rounded-2xl hover:shadow-xl border border-gray-100 hover:border-[#88C300]"
                >
                  <div className="flex flex-col h-full p-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#88C300] transition-colors">
                          {job.title}
                        </h3>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#88C300] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-[#88C300] bg-[#88C300]/10 rounded-full">
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {job.department}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 capitalize bg-gray-100 rounded-full">
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.jobType?.replace("-", " ")}
                        </span>
                      </div>
                      
                      <p className="leading-relaxed text-gray-600 text-sm">
                        {job.description?.slice(0, 120)}
                        {job.description?.length > 120 ? "..." : ""}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {job.applicationDeadline
                            ? new Date(job.applicationDeadline).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })
                            : "Open"}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#88C300] rounded-lg group-hover:bg-[#6ea000] transition-colors">
                        Apply Now
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="px-4 py-16 mt-16 bg-[#88C300]">
          <div className="container max-w-4xl mx-auto text-center">
            <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Don't see the right position?
            </h3>
            <p className="max-w-2xl mx-auto mb-8 text-xl text-white/95">
              We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <button className="inline-flex items-center px-8 py-4 font-semibold text-[#88C300] bg-white rounded-lg shadow-lg hover:shadow-xl transition-all">
              Submit Your Resume
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

export default JobPage;