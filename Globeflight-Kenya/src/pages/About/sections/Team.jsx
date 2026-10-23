import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Mail, Quote, Users, ArrowRight, Briefcase } from 'lucide-react';
import { ourTeam } from '@/constants/aboutpage';

import { Link, useLocation } from "react-router-dom";
const Team = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Enhanced team data with correct emails
  const enhancedTeam = ourTeam.map((member, idx) => ({
    ...member,
    email: idx === 0 ? "carolynew@globeflight.co.ke" :
          idx === 1 ? "accounts@globeflight.co.ke" :
          "cs@globeflight.co.ke"
  }));

  return (
    <section className="py-24 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="container px-4 mx-auto mb-16">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/*<span className="inline-flex items-center gap-2 px-6 py-2 mb-6 text-sm font-bold text-green-600 rounded-full shadow-sm bg-green-50">
            <Users className="w-4 h-4" />
            OUR LEADERSHIP
          </span>*/}
          
          <h2 className="mb-6 text-5xl font-black leading-tight text-gray-900 md:text-7xl">
            Meet The <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Team</span>
          </h2>
          
          <p className="text-xl leading-relaxed text-gray-600 md:text-2xl">
            Our experienced team of professionals is dedicated to delivering excellence and innovation in global logistics
          </p>
        </motion.div>
      </div>

      {/* Team Grid - Fully Responsive */}
      <div className="container px-4 mx-auto sm:px-6">
        <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
          {enhancedTeam.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(idx)}
              className="touch-manipulation"
            >
              <Card
                className="h-full overflow-hidden transition-all duration-500 border-0 shadow-lg cursor-pointer group hover:shadow-2xl active:scale-95"
                onClick={() => setSelectedMember(member)}
              >
                {/* Image Container - Responsive Height */}
                <div className="relative overflow-hidden h-64 sm:h-72 md:h-80">
                  <motion.img
                    className="object-cover w-full h-full"
                    src={member.img}
                    alt={member.name}
                    animate={{ scale: hoveredIndex === idx ? 1.1 : 1 }}
                    transition={{ duration: 0.6 }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 transition-opacity duration-300 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80" />

                  {/* Email Action - Responsive */}
                  <motion.div
                    className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: hoveredIndex === idx ? 0 : 20, opacity: hoveredIndex === idx ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <a
                      href={`mailto:${member.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 p-2.5 sm:p-3 transition-all rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 active:bg-white/40 text-white font-medium text-sm sm:text-base"
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Send Email</span>
                    </a>
                  </motion.div>
                </div>

                {/* Content - Responsive Padding and Text */}
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-2 text-xl sm:text-2xl font-bold text-gray-900">{member.name}</h3>
                  <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold tracking-wider text-green-600 uppercase">
                    {member.position}
                  </p>
                  <p className="mb-4 text-sm sm:text-base text-gray-600 line-clamp-3">{member.desc}</p>

                  {/* View Profile Button - Responsive */}
                  <Button
                    className="w-full font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:from-green-700 active:to-emerald-800 group text-sm sm:text-base py-2 sm:py-3"
                  >
                    View Full Profile
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Modal - Responsive */}
      <AnimatePresence>
        {selectedMember && (
          <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
            <DialogContent className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden max-h-[95vh] overflow-y-auto">
              <div className="grid gap-0 md:grid-cols-5">
                {/* Left Side - Image */}
                <div className="relative h-48 sm:h-64 md:col-span-2 md:h-full min-h-[300px]">
                  <img
                    src={selectedMember.img}
                    alt={selectedMember.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute text-white bottom-4 left-4">
                    <h3 className="text-xl sm:text-2xl font-bold">{selectedMember.name}</h3>
                    <p className="text-green-400 text-sm sm:text-base">{selectedMember.position}</p>
                  </div>
                </div>

                {/* Right Side - Content */}
                <div className="p-4 sm:p-6 md:p-8 md:col-span-3">
                  {/* Quote Section */}
                  <div className="mb-6">
                    <Quote className="w-6 h-6 sm:w-8 sm:h-8 mb-3 text-green-500" />
                    <p className="text-base sm:text-lg italic leading-relaxed text-gray-700">
                      {selectedMember.desc}
                    </p>
                  </div>

                  {/* Email Display */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-5 h-5 text-green-600" />
                      <a
                        href={`mailto:${selectedMember.email}`}
                        className="font-medium text-green-600 hover:text-green-700 hover:underline break-all"
                      >
                        {selectedMember.email}
                      </a>
                    </div>
                  </div>

                  {/* Contact Action */}
                  <Button
                    className="w-full text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    onClick={() => window.location.href = `mailto:${selectedMember.email}`}
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <motion.div 
        className="container px-4 mx-auto mt-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="p-12 text-center text-white shadow-2xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Join Our Growing Team</h2>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-green-50">
            We're always looking for talented individuals who share our passion for excellence in logistics
          </p>
         <Link to="/jobs" className="inline-block">
  <Button
    size="lg"
    className="flex items-center gap-2 px-8 py-6 text-lg font-bold text-green-600 bg-white rounded-full hover:bg-gray-100"
  >
    <Briefcase className="w-5 h-5" />
    View Career Opportunities
  </Button>
</Link>
        </div>
      </motion.div>
    </section>
  );
}

export default Team;