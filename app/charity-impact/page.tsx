"use client";

import { motion } from "framer-motion";
import { Icon } from '@iconify/react';
import { Card, CardContent } from "@/components/ui/card";

// Mock data - Replace with actual data from your backend
const charityData = {
  totalDonated: 125000,
  studentsHelped: 2500,
  topCountries: [
    { name: "United States", amount: 45000, students: 900 },
    { name: "India", amount: 25000, students: 500 },
    { name: "United Kingdom", amount: 20000, students: 400 },
    { name: "Nigeria", amount: 15000, students: 300 },
    { name: "Brazil", amount: 10000, students: 200 },
  ]
};

const ImpactCard = ({ icon, title, value, subtitle }: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
}) => (
  <Card className="relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-rose-500/0 to-red-500/0 group-hover:from-rose-500/5 group-hover:via-rose-500/5 group-hover:to-red-500/5 transition-all duration-500" />
    <CardContent className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6"
      >
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 backdrop-blur-xl">
          <Icon icon={icon} className="h-8 w-8 text-rose-500 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-rose-600/80 dark:text-rose-400/80 mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
      </motion.div>
    </CardContent>
  </Card>
);

const CountryCard = ({ country, amount, students, index }: {
  country: string;
  amount: number;
  students: number;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-800/30 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
    <div className="relative flex items-center justify-between p-6 rounded-2xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/10 dark:border-gray-700/10 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-5">
        <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20">
          <Icon icon="solar:flag-bold-duotone" className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-1">{country}</h4>
          <p className="text-sm text-gray-500">{students.toLocaleString()} students helped</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">
          ${amount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">donated</p>
      </div>
    </div>
  </motion.div>
);

export default function CharityImpact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/20 to-red-50/20 dark:from-gray-900 dark:via-rose-900/5 dark:to-red-900/5 py-16 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400 text-transparent bg-clip-text">
              Our Charity Impact
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              50% of Notchy&apos;s profits go directly to student charities worldwide, making education accessible to all.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <ImpactCard
              icon="solar:hand-heart-bold-duotone"
              title="Total Donated"
              value={`$${charityData.totalDonated.toLocaleString()}`}
              subtitle="And growing every day"
            />
            <ImpactCard
              icon="solar:users-group-rounded-bold-duotone"
              title="Students Helped"
              value={charityData.studentsHelped.toLocaleString()}
              subtitle="Across the globe"
            />
            <ImpactCard
              icon="solar:globe-bold-duotone"
              title="Countries Reached"
              value={charityData.topCountries.length.toString()}
              subtitle="Top contributing nations"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-3xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/20 p-8 md:p-10"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20">
                <Icon icon="solar:chart-2-bold-duotone" className="h-6 w-6 text-rose-500" />
              </div>
              <h2 className="text-3xl font-bold">Top Contributing Countries</h2>
            </div>
            <div className="space-y-6">
              {charityData.topCountries.map((country, index) => (
                <CountryCard
                  key={country.name}
                  country={country.name}
                  amount={country.amount}
                  students={country.students}
                  index={index}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <div className="inline-block p-6 rounded-2xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/20">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Together, we&apos;re making education accessible to students worldwide.
                <br />
                <span className="text-rose-500 dark:text-rose-400 font-medium">
                  Every notebook you create helps support this mission.
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 