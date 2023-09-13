const express = require("express");
const app = express();
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
mongoose
  .connect("mongodb://127.0.0.1:27017/task")
  .then(() => console.log("Connected!"));

const taskSchema = {
  taskNo: String,
  taskName: String,
  createdBy: String,
  assignedTo: [String],
};

//app.use();

const Task = mongoose.model("Task", taskSchema);

app.post("/createTask", jsonParser, async (req, res) => {
  let data = await Task.aggregate().count("totalCount").exec();
  let taskNo = data ? data[0]?.totalCount : 0;
  let body = req.body;
  body.taskNo = "Task" + taskNo;
  let student = new Task(body);
  student
    .save()
    .then((doc) => {
      res.send(doc);
    })
    .catch((err) => console.log(err));
});

app.get("/getTasks/:userId", async (req, res) => {
  let data = await Task.aggregate()
    .match({
      $or: [
        { createdBy: req.params.userId },
        { assignedTo: req.params.userId },
      ],
    })
    .exec();
  res.send(data);
});

app.put("/updateTasks/:taskId", jsonParser, async (req, res) => {
  const filter = { _id: req.params.taskId };
  //   const update = { assignedTo: req.body.assignedTo };

  const update = { $addToSet: { assignedTo: req.body.assignedTo } };

  const doc = await Task.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true, // Make this update into an upsert
  });

  if (!doc) {
    res.send({ status: false, message: "Task assigned failed" });
  }
  res.send(doc);
});

app.post("/createSubTasks/:taskId", jsonParser, async (req, res) => {
  let data = await Task.findById({ _id: req.params.taskId }).lean();
  if (req.body.status == "Update") {
    const filter = { _id: req.params.taskId };
    const update = { $addToSet: { assignedTo: req.body.assignedTo } };
    const doc = await Task.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true, // Make this update into an upsert
    });

    if (!doc) {
      res.send({ status: false, message: "Task assigned failed" });
    }
    res.send(doc);
  } else {
    let body = req.body;
    body.taskNo = data.taskNo + "_1";
    let student = new Task(body);
    student
      .save()
      .then((doc) => {
        res.send(doc);
      })
      .catch((err) => console.log(err));
  }
});

app.put("/UpdateSubTasks/:taskId", jsonParser, async (req, res) => {
  let data = await Task.findById({ _id: req.params.taskId }).lean();

  if (req.body.status == "Update") {
    const filter = { _id: req.params.taskId };
    const update = { $addToSet: { assignedTo: req.body.assignedTo } };
    const doc = await Task.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true, // Make this update into an upsert
    });

    if (!doc) {
      res.send({ status: false, message: "Task assigned failed" });
    }
    res.send(doc);
  } else {
    let taskNumber = data.taskNo.split("_");

    let taskString = taskNumber[0];
    let taskNumberFinal = +taskNumber[1] + 1;

    let body = req.body;
    body.taskNo = taskString + "_" + taskNumberFinal;
    let student = new Task(body);
    student
      .save()
      .then((doc) => {
        res.send(doc);
      })
      .catch((err) => console.log(err));
  }
});

app.listen(process.env.port || 3000);
console.log("webserver is listening to port 3000");
