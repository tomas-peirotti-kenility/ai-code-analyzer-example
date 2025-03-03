import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MSchema } from 'mongoose';

@Schema({ _id: false })
export class Timestamp {
  @Prop({ type: MSchema.Types.Date, required: true })
  createdAt: Date;

  @Prop({ type: MSchema.Types.Date, required: true })
  updatedAt: Date;
}

@Schema({ _id: false })
export class PreviewEntity {
  _id: Types.ObjectId;

  @Prop({ type: MSchema.Types.String })
  displayName?: string;
}

@Schema({ _id: false })
export class CreatedBy {
  @Prop({ type: MSchema.Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: MSchema.Types.String, required: true })
  displayName: string;
}

const CreatedBySchema = SchemaFactory.createForClass(CreatedBy);

@Schema({ _id: false })
export class UpdatedBy {
  @Prop({ type: MSchema.Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: MSchema.Types.String, required: true })
  displayName: string;
}

const UpdatedBySchema = SchemaFactory.createForClass(UpdatedBy);

@Schema({ _id: false })
export class BaseEntity extends PreviewEntity {
  @Prop({ type: MSchema.Types.Date })
  createdAt: Date;

  @Prop({ type: MSchema.Types.Date })
  updatedAt: Date;

  @Prop({ type: CreatedBySchema })
  createdBy?: CreatedBy;

  @Prop({ type: UpdatedBySchema })
  updatedBy?: UpdatedBy;

  @Prop({ type: MSchema.Types.Boolean, default: false })
  deleted?: boolean;

  @Prop({ type: MSchema.Types.Date })
  deletedAt?: Date;
}

@Schema({ _id: false })
export class Phone {
  @Prop({ type: MSchema.Types.String, required: true })
  countryCode: string;

  @Prop({ type: MSchema.Types.String, required: true })
  isoCode: string;

  @Prop({ type: MSchema.Types.String, required: true })
  number: string;

  @Prop({ type: MSchema.Types.String, required: true })
  e164: string;
}
