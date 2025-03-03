import { Injectable, NotFoundException } from '@nestjs/common';
import { Connection, Model, Types, ClientSession } from 'mongoose';

@Injectable()
export class MongoDBService {
  findOne = async <T, LeanT>(
    Model: Model<T>,
    filter: Record<string, any>,
    lean = true,
    validateEmpty = true,
    session: ClientSession | null = null,
    sort?: Record<string, any>,
  ): Promise<T | LeanT | null> => {
    if (filter._id) filter._id = new Types.ObjectId(filter._id);
    let request = Model.findOne(filter);

    if (sort) request = request.sort(sort);
    if (session) request.session(session);
    if (lean) request.lean;
    else request.exec;

    const document = await request;
    const { modelName } = Model;

    if (validateEmpty && !document)
      throw new NotFoundException(`${modelName} not found`);
    if (!document) return null;
    if (lean) return document.toObject() as LeanT;
    return document as T;
  };

  findOneById = async <T, LeanT>(
    Model: Model<T>,
    _id: string,
    lean = true,
    validateEmpty = true,
    session: ClientSession | null = null,
  ): Promise<T | LeanT | null> => {
    return await this.findOne<T, LeanT>(
      Model,
      {
        _id,
      },
      lean,
      validateEmpty,
      session,
    );
  };

  findByIds = async <T, LeanT>(
    Model: Model<T>,
    ids: string[],
    lean = true,
    validateEmpty = true,
    session: ClientSession | null = null,
  ): Promise<T[] | LeanT[]> => {
    const filter = { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } };
    const request = Model.find(filter);

    if (session) request.session(session);
    if (lean) request.lean;
    else request.exec;

    const documents = await request;
    const { modelName } = Model;

    if (validateEmpty) {
      const missingIds = ids.filter(
        (id) => documents.findIndex((doc) => doc._id.toString() === id) === -1,
      );
      if (missingIds.length > 0)
        throw new NotFoundException(
          `The provided IDs [${missingIds.join(
            ', ',
          )}] do not match any ${modelName}`,
        );
    }

    if (lean) return documents.map((doc) => doc.toObject() as LeanT);

    return documents as T[];
  };

  updateOneById = async <T>(
    Model: Model<T>,
    uid: string,
    document: Record<any, any>,
    session: ClientSession | null = null,
  ): Promise<T> => {
    const updateRequest = Model.updateOne(
      { _id: new Types.ObjectId(uid) },
      { ...document },
    );
    if (session) updateRequest.session(session);
    updateRequest.exec;
    await updateRequest;

    const findRequest = Model.findById(uid);
    if (session) findRequest.session(session);

    return (await findRequest.lean()) as T;
  };

  updateMany = async <T>(
    Model: Model<T>,
    filter: Record<string, any>,
    document: Record<any, any>,
    returnDocs = false,
    session: ClientSession | null = null,
  ): Promise<any> => {
    const updateRequest = Model.updateMany(filter, document);
    if (session) updateRequest.session(session);
    updateRequest.exec;

    const result = await updateRequest;

    if (returnDocs && result.modifiedCount > 0) {
      const findRequest = Model.find(filter);
      if (session) findRequest.session(session);
      findRequest.lean;

      return await findRequest;
    }

    return result;
  };

  upsertOne = async <T>(
    Model: Model<T>,
    filter: Record<string, any>,
    document: Record<any, any>,
    session: ClientSession | null = null,
  ): Promise<T> => {
    const upsertRequest = Model.updateOne(
      filter,
      { ...document },
      { upsert: true, new: true },
    );
    if (session) upsertRequest.session(session);
    upsertRequest.exec;
    await upsertRequest;

    const findRequest = Model.findOne(filter);

    if (session) findRequest.session(session);
    return (await findRequest.lean()) as T;
  };

  insertMany = async <T>(
    Model: Model<T>,
    documents: Record<any, any>[],
  ): Promise<any> => {
    const insertRequest = Model.insertMany(documents);
    return await insertRequest;
  };

  upsertOneById = async <T>(
    Model: Model<T>,
    uid: string,
    document: Record<any, any>,
    session: ClientSession | null = null,
  ): Promise<T> => {
    return await this.upsertOne(
      Model,
      { _id: new Types.ObjectId(uid) },
      document,
      session,
    );
  };

  deleteOne = async <T>(
    Model: Model<T>,
    filter: Record<string, any>,
    session: ClientSession | null = null,
  ): Promise<void> => {
    if (filter._id) filter._id = new Types.ObjectId(filter._id);

    const deleteRequest = Model.findByIdAndDelete(filter);
    if (session) deleteRequest.session(session);
    await deleteRequest.exec();
  };

  deleteOneById = async <T>(
    Model: Model<T>,
    uid: string,
    session: ClientSession | null = null,
  ): Promise<void> => {
    const deleteRequest = Model.deleteOne({ _id: new Types.ObjectId(uid) });
    if (session) deleteRequest.session(session);
    await deleteRequest.exec();
  };

  deleteMany = async <T>(
    Model: Model<T>,
    match: Record<string, any>,
    session: ClientSession | null = null,
  ) => {
    const deleteRequest = Model.deleteMany(match);
    if (session) deleteRequest.session(session);
    deleteRequest.exec;
    return await deleteRequest;
  };

  findAll = async <T, LeanT>(
    Model: Model<T>,
    match: Record<string, any>,
    page = 1,
    limit = 15,
    sort: Record<string, any> = {},
  ): Promise<{ objects: LeanT[]; total?: number }> => {
    const aggregatePipeline = [];
    let total = undefined;
    if (!!!Object.keys(sort).length) sort = { updatedAt: -1 };

    if (!!Object.keys(match).length)
      aggregatePipeline.push({ $match: { ...match } });
    aggregatePipeline.push({ $sort: sort });
    if (page !== 1)
      aggregatePipeline.push({ $skip: limit ? (+page - 1) * +limit : 0 });
    aggregatePipeline.push({ $limit: +limit });

    if (page === 1) {
      const groupPipeline: any = [
        { $group: { _id: null, total: { $sum: 1 } } },
      ];
      if (!!Object.keys(match).length)
        groupPipeline.unshift({ $match: { ...match } });

      const totals = await Model.aggregate([groupPipeline]).exec();
      if (totals.length) total = totals[0].total;
    }

    const objects = await Model.aggregate<LeanT>(aggregatePipeline).exec();
    return { objects, total };
  };

  handleConnectionErrors = (connection: Connection) => {
    ['disconnected', 'close', 'error'].forEach(function (name) {
      connection.on(name, (err) => {
        console.log(`Error in database connection - ${err}`);
        if (!!process.env.RESTART_MONGO_IN_EXEPTION) process.exit(1);
      });
    });
  };

  count = <T>(Model: Model<T>, match: Record<string, any>): Promise<number> => {
    return Model.count(match).exec();
  };
}
