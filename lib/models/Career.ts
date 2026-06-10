import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJobApplication {
  _id?: any; name: string; email: string; phone: string; coverLetter: string;
  cvUrl: string; status: "applied"|"reviewing"|"interview"|"rejected"|"hired";
  appliedAt: Date; notes: string;
}

export interface ICareerJob extends Document {
  title: string; department: string; location: string;
  type: "full-time"|"part-time"|"contract"|"remote";
  description: string; requirements: string; benefits: string; salary: string;
  isActive: boolean; applications: IJobApplication[]; createdAt: Date; updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>({
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String, default: "" },
  coverLetter: { type: String, default: "" },
  cvUrl:       { type: String, default: "" },
  status:      { type: String, enum: ["applied","reviewing","interview","rejected","hired"], default: "applied" },
  appliedAt:   { type: Date, default: Date.now },
  notes:       { type: String, default: "" },
});

const CareerJobSchema = new Schema<ICareerJob>({
  title:        { type: String, required: true, trim: true },
  department:   { type: String, default: "General" },
  location:     { type: String, default: "Lagos, Nigeria" },
  type:         { type: String, enum: ["full-time","part-time","contract","remote"], default: "full-time" },
  description:  { type: String, default: "" },
  requirements: { type: String, default: "" },
  benefits:     { type: String, default: "" },
  salary:       { type: String, default: "" },
  isActive:     { type: Boolean, default: true },
  applications: { type: [JobApplicationSchema], default: [] },
}, { timestamps: true });

const CareerJob: Model<ICareerJob> = mongoose.models.CareerJob || mongoose.model<ICareerJob>("CareerJob", CareerJobSchema);
export default CareerJob;
